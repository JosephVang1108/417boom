import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import JesusFace, { JesusFaceHandle } from './JesusFace';

// Generated with OpenArt against pure black so it blends into the app.
// The video is the living portrait (breathing, hair in the breeze,
// blinking, glancing around); the still image is its poster/fallback.
// TODO: bundle these files locally before a store release.
export const PORTRAIT_URL =
  'https://cdn.openart.ai/openart-ai/production/2026-08/create-image/JZMxRtTkpmFe2dgMdSQI/image_1787807279541_3c4d75bb_1787807280769_4f5443ba.png';
// Seedance 2.5 clip whose last frame equals its first frame — it loops
// natively with no visible seam.
export const PORTRAIT_VIDEO_URL: string | null =
  'https://galaxy-prod.tlcdn.com/gen/debef90d4b77451384e73d6955aab448.mp4';

// Eyes closed, head gently bowed — shown while he prays aloud.
export const PRAYING_URL =
  'https://galaxy-prod.tlcdn.com/gen/6a7bd948424440198d0ea1eb0ab950ca.png';
export const PRAYING_VIDEO_URL: string | null =
  'https://galaxy-prod.tlcdn.com/gen/c40483a9d15140b4a6997c3a9190a631.mp4';

// Real head turns: 4s clips pinned to exact start/end frames so they
// chain seamlessly with the center loop. 'go' turns away from center,
// 'back' returns to center.
const TURN_CLIPS = {
  left: {
    go: 'https://g.tlcdn.com/gen/2c35f43b20614618a6df8424dce2761e.mp4',
    back: 'https://g.tlcdn.com/gen/c36abfc605874e88b389009f96dc3605.mp4',
  },
  right: {
    go: 'https://g.tlcdn.com/gen/dc2ec7ec9b46464b825df9c71fa4a0ef.mp4',
    back: 'https://g.tlcdn.com/gen/e2aaa43ad04d4f42963b55e2c6ebb964.mp4',
  },
} as const;

// Turn clips read as slow motion at natural speed; play them faster.
const TURN_SPEED = 1.6;
// How long he holds the turned pose before glancing back.
const TURN_HOLD_MS = 1200;
// Breather between glances so he doesn't whip around constantly.
const GLANCE_COOLDOWN_MS = 4000;

interface Props {
  width: number;
  height: number;
  listening?: boolean;
  speaking?: boolean;
  praying?: boolean;
}

/**
 * Full-bleed living portrait on pure black. Prefers the looping video
 * (real breathing, hair, blinks); falls back to the still image with a
 * code-driven breath, then to the drawn animated face if neither loads.
 * A heavenly glow pulses over either, brighter while he speaks, and he
 * leans gently toward touch.
 */
const JesusPortrait = forwardRef<JesusFaceHandle, Props>(function JesusPortrait(
  { width, height, listening = false, speaking = false, praying = false },
  ref
) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackRef = useRef<JesusFaceHandle>(null);

  const useVideo = !!PORTRAIT_VIDEO_URL && !videoFailed;

  const player = useVideoPlayer(useVideo ? PORTRAIT_VIDEO_URL : null, (p) => {
    p.loop = true; // first and last frames match — native loop is seamless
    p.muted = true;
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });
  useEffect(() => {
    if (status === 'error') setVideoFailed(true);
  }, [status]);

  // The still portrait covers the video while it loads, then fades out.
  const stillOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'readyToPlay') {
      Animated.timing(stillOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [status, stillOpacity]);

  // Praying: cross-dissolve to the eyes-closed portrait while he prays.
  const prayPlayer = useVideoPlayer(PRAYING_VIDEO_URL, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const prayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (praying) {
      if (PRAYING_VIDEO_URL) prayPlayer.play();
      Animated.timing(prayOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(prayOpacity, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }).start(() => {
        if (PRAYING_VIDEO_URL) prayPlayer.pause();
      });
    }
  }, [praying, prayOpacity, prayPlayer]);

  // ---- Real head turns -------------------------------------------------
  // A sustained lean of the phone triggers one quick "glance": the
  // turn-away clip plays (sped up to natural pace), he holds the pose a
  // beat, then the return clip — preloaded in a second player while the
  // first was playing — brings him back with no network wait. The whole
  // glance is one self-completing sequence, so he can never be left
  // stuck facing sideways.
  const goPlayer = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.muted = true;
    p.playbackRate = TURN_SPEED;
  });
  const backPlayer = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.muted = true;
    p.playbackRate = TURN_SPEED;
  });
  const turnOpacity = useRef(new Animated.Value(0)).current;
  const goOpacity = useRef(new Animated.Value(1)).current;
  const backOpacity = useRef(new Animated.Value(0)).current;
  const phaseRef = useRef<'idle' | 'go' | 'hold' | 'awaitBack' | 'back'>(
    'idle'
  );
  const glanceIdRef = useRef(0);
  const glanceEndedAtRef = useRef(0);
  const backReadyRef = useRef(false);
  const turnDisabledRef = useRef(false);
  const turnFailuresRef = useRef(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoneRef = useRef<'left' | 'right' | 'center'>('center');
  const zoneSinceRef = useRef(0);
  const flagsRef = useRef({ speaking, praying });
  flagsRef.current = { speaking, praying };

  const clearTurnTimers = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };
  useEffect(() => clearTurnTimers, []);

  // End of a glance — clean or failed. On failure he simply fades back
  // to the living center loop; three failures in a row (bad network)
  // switch glances off for the session.
  const finishGlance = (failed: boolean) => {
    clearTurnTimers();
    if (failed) {
      turnFailuresRef.current += 1;
      if (turnFailuresRef.current >= 3) turnDisabledRef.current = true;
    } else {
      turnFailuresRef.current = 0;
    }
    phaseRef.current = 'idle';
    glanceEndedAtRef.current = Date.now();
    goPlayer.pause();
    backPlayer.pause();
    Animated.timing(turnOpacity, {
      toValue: 0,
      duration: failed ? 300 : 500,
      useNativeDriver: true,
    }).start();
  };

  const playBack = () => {
    phaseRef.current = 'back';
    // The go clip's last frame equals the back clip's first frame, so
    // an instant swap between the two players is invisible.
    backOpacity.setValue(1);
    goOpacity.setValue(0);
    backPlayer.play();
  };

  const requestBack = () => {
    if (backReadyRef.current) playBack();
    else phaseRef.current = 'awaitBack'; // plays the moment it loads
  };

  const startGlance = (dir: 'left' | 'right') => {
    if (turnDisabledRef.current || phaseRef.current !== 'idle' || !useVideo)
      return;
    if (flagsRef.current.speaking || flagsRef.current.praying) return;
    if (Date.now() - glanceEndedAtRef.current < GLANCE_COOLDOWN_MS) return;
    const id = ++glanceIdRef.current;
    phaseRef.current = 'go';
    backReadyRef.current = false;
    goOpacity.setValue(1);
    backOpacity.setValue(0);
    // Watchdog: a stalled stream must never leave him stuck sideways.
    watchdogRef.current = setTimeout(() => {
      if (glanceIdRef.current === id && phaseRef.current !== 'idle') {
        finishGlance(true);
      }
    }, 14000);
    goPlayer
      .replaceAsync(TURN_CLIPS[dir].go)
      .then(() => {
        if (glanceIdRef.current !== id || phaseRef.current !== 'go') return;
        goPlayer.play();
        Animated.timing(turnOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      })
      .catch(() => {
        if (glanceIdRef.current === id && phaseRef.current !== 'idle') {
          finishGlance(true);
        }
      });
    // Preload the return clip while the turn-away clip plays, so the
    // way back never waits on the network.
    backPlayer
      .replaceAsync(TURN_CLIPS[dir].back)
      .then(() => {
        if (glanceIdRef.current !== id) return;
        backReadyRef.current = true;
        if (phaseRef.current === 'awaitBack') playBack();
      })
      .catch(() => {
        if (glanceIdRef.current === id && phaseRef.current !== 'idle') {
          finishGlance(true);
        }
      });
  };

  useEventListener(goPlayer, 'playToEnd', () => {
    if (phaseRef.current !== 'go') return;
    phaseRef.current = 'hold';
    const hold =
      flagsRef.current.speaking || flagsRef.current.praying ? 0 : TURN_HOLD_MS;
    holdTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'hold') requestBack();
    }, hold);
  });

  useEventListener(backPlayer, 'playToEnd', () => {
    if (phaseRef.current === 'back') finishGlance(false);
  });

  useEventListener(goPlayer, 'statusChange', ({ status: s }) => {
    if (s === 'error' && phaseRef.current !== 'idle') finishGlance(true);
  });
  useEventListener(backPlayer, 'statusChange', ({ status: s }) => {
    if (s === 'error' && phaseRef.current !== 'idle') finishGlance(true);
  });

  // If he starts speaking or praying mid-glance, cut the hold short and
  // come back to face forward right away.
  useEffect(() => {
    if ((speaking || praying) && phaseRef.current === 'hold') {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      requestBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaking, praying]);

  const evaluateGaze = (x: number) => {
    const zone: 'left' | 'right' | null =
      x < -0.55 ? 'left' : x > 0.55 ? 'right' : null;
    if (!zone) {
      zoneRef.current = 'center';
      return;
    }
    const now = Date.now();
    if (zone !== zoneRef.current) {
      zoneRef.current = zone;
      zoneSinceRef.current = now;
      return;
    }
    if (now - zoneSinceRef.current > 350) startGlance(zone);
  };

  const gazeX = useRef(new Animated.Value(0)).current;
  const gazeY = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const idle = useRef(true);
  const restTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    lookToward: (x: number, y: number) => {
      if (imageFailed && !useVideo) {
        fallbackRef.current?.lookToward(x, y);
        return;
      }
      idle.current = false;
      if (restTimer.current) clearTimeout(restTimer.current);
      evaluateGaze(Math.max(-1, Math.min(1, x)));
      Animated.parallel([
        Animated.spring(gazeX, {
          toValue: Math.max(-1, Math.min(1, x)),
          useNativeDriver: true,
          speed: 12,
          bounciness: 3,
        }),
        Animated.spring(gazeY, {
          toValue: Math.max(-1, Math.min(1, y)),
          useNativeDriver: true,
          speed: 12,
          bounciness: 3,
        }),
      ]).start();
      restTimer.current = setTimeout(() => {
        idle.current = true;
        Animated.parallel([
          Animated.spring(gazeX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(gazeY, { toValue: 0, useNativeDriver: true }),
        ]).start();
      }, 4000);
    },
    rest: () => {
      idle.current = true;
      Animated.parallel([
        Animated.spring(gazeX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(gazeY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    },
  }));

  // Code-driven breathing for the still image (the fallback, and the
  // crossfade hold layer — the video itself breathes on its own).
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  // Heavenly glow: soft pulse normally, brighter and faster while speaking.
  useEffect(() => {
    const duration = speaking ? 900 : 3200;
    const peak = speaking ? 0.55 : listening ? 0.38 : 0.25;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: peak,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: peak * 0.35,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [speaking, listening, glow]);

  if (imageFailed && !useVideo) {
    return (
      <View style={[styles.fallbackWrap, { width, height }]}>
        <JesusFace
          ref={fallbackRef}
          size={Math.min(width * 0.8, 320)}
          listening={listening}
          speaking={speaking}
        />
      </View>
    );
  }

  const breathScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.012],
  });
  const leanX = gazeX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });
  const leanY = gazeY.interpolate({
    inputRange: [-1, 1],
    outputRange: [-5, 5],
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            // Slight overscan so the lean never reveals the black edge.
            transform: [
              { translateX: leanX },
              { translateY: leanY },
              { scale: 1.03 },
            ],
          },
        ]}
      >
        {useVideo && (
          <VideoView
            player={player}
            style={styles.portrait}
            contentFit="cover"
            nativeControls={false}
          />
        )}
        {/* Still portrait: fallback when there's no video, and the
            breathing crossfade layer during the loop's calm holds. */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            useVideo && { opacity: stillOpacity },
            { transform: [{ scale: breathScale }] },
          ]}
        >
          <Image
            source={{ uri: PORTRAIT_URL }}
            style={styles.portrait}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        </Animated.View>

        {/* Head glances: the turn-away and turn-back clips live in two
            players so the return is preloaded; their shared boundary
            frame makes the swap between them invisible. */}
        {useVideo && (
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: turnOpacity }]}
            pointerEvents="none"
          >
            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: goOpacity }]}
            >
              <VideoView
                player={goPlayer}
                style={styles.portrait}
                contentFit="cover"
                nativeControls={false}
              />
            </Animated.View>
            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: backOpacity }]}
            >
              <VideoView
                player={backPlayer}
                style={styles.portrait}
                contentFit="cover"
                nativeControls={false}
              />
            </Animated.View>
          </Animated.View>
        )}

        {/* Praying: eyes closed, head bowed — fades in while he prays. */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: prayOpacity, transform: [{ scale: breathScale }] },
          ]}
          pointerEvents="none"
        >
          {PRAYING_VIDEO_URL ? (
            <VideoView
              player={prayPlayer}
              style={styles.portrait}
              contentFit="cover"
              nativeControls={false}
            />
          ) : (
            <Image
              source={{ uri: PRAYING_URL }}
              style={styles.portrait}
              resizeMode="cover"
            />
          )}
        </Animated.View>
      </Animated.View>

      {/* Heavenly glow above the face, pulsing */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: glow }]}
        pointerEvents="none"
      >
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="30%" r="45%">
              <Stop offset="0%" stopColor="#F7D774" stopOpacity="0.7" />
              <Stop offset="55%" stopColor="#F7D774" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#F7D774" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={width / 2} cy={height * 0.3} r={width * 0.7} fill="url(#halo)" />
        </Svg>
      </Animated.View>

      {/* Fade the lower part into black so the conversation reads clearly */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000000" stopOpacity="0" />
              <Stop offset="0.55" stopColor="#000000" stopOpacity="0" />
              <Stop offset="0.82" stopColor="#000000" stopOpacity="0.75" />
              <Stop offset="1" stopColor="#000000" stopOpacity="0.97" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#bottomFade)" />
        </Svg>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  portrait: {
    width: '100%',
    height: '100%',
  },
  fallbackWrap: {
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default JesusPortrait;
