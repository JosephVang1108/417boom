import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import JesusFace, { JesusFaceHandle } from './JesusFace';

// All portrait media ships inside the app (assets/media) — instant
// loads, no network dependency. The video is the living portrait
// (breathing, hair in the breeze, blinking); the still image covers it
// while the player spins up. Loop clips have matching first/last
// frames, so native looping is seamless.
const PORTRAIT_IMG = require('../../assets/media/portrait.png');
const PORTRAIT_VIDEO = require('../../assets/media/portrait-loop.mp4');

// Eyes closed, head gently bowed — shown while he prays aloud.
const PRAYING_IMG = require('../../assets/media/praying.png');
const PRAYING_VIDEO = require('../../assets/media/praying-loop.mp4');

// Phones fill the screen (cover). iPads are squarer, so cover would
// crop into his face — there the full portrait shows centered instead,
// and because the art fades to black at its edges on a black app
// background, the letterboxing is invisible.
const IS_PAD = Platform.OS === 'ios' && (Platform as { isPad?: boolean }).isPad === true;
const PORTRAIT_FIT = (IS_PAD ? 'contain' : 'cover') as 'contain' | 'cover';

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

  const useVideo = !videoFailed;

  const player = useVideoPlayer(useVideo ? PORTRAIT_VIDEO : null, (p) => {
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
  const prayPlayer = useVideoPlayer(PRAYING_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const prayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (praying) {
      prayPlayer.play();
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
        prayPlayer.pause();
      });
    }
  }, [praying, prayOpacity, prayPlayer]);

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
            contentFit={PORTRAIT_FIT}
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
            source={PORTRAIT_IMG}
            style={styles.portrait}
            resizeMode={PORTRAIT_FIT}
            onError={() => setImageFailed(true)}
          />
        </Animated.View>

        {/* Praying: eyes closed, head bowed — fades in while he prays. */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: prayOpacity, transform: [{ scale: breathScale }] },
          ]}
          pointerEvents="none"
        >
          <VideoView
            player={prayPlayer}
            style={styles.portrait}
            contentFit={PORTRAIT_FIT}
            nativeControls={false}
          />
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
