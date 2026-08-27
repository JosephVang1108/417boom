import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import JesusFace, { JesusFaceHandle } from './JesusFace';

// Realistic 4K portrait generated with OpenArt (Nano Banana 2).
// TODO: bundle this file locally before a store release.
const PORTRAIT_URL =
  'https://cdn.openart.ai/openart-ai/production/2026-08/create-image/JZMxRtTkpmFe2dgMdSQI/image_1787806329208_3da2b955_1787806329988_800c86b5.png';

interface Props {
  size?: number;
  listening?: boolean;
  speaking?: boolean;
}

/**
 * The realistic portrait face: breathes slowly, glows while speaking,
 * and leans gently toward touch. Falls back to the drawn animated face
 * if the image cannot load (e.g. no internet on first run).
 */
const JesusPortrait = forwardRef<JesusFaceHandle, Props>(function JesusPortrait(
  { size = 300, listening = false, speaking = false },
  ref
) {
  const height = size * 1.2;

  const [imageFailed, setImageFailed] = useState(false);
  const fallbackRef = useRef<JesusFaceHandle>(null);

  const gazeX = useRef(new Animated.Value(0)).current;
  const gazeY = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const idle = useRef(true);
  const restTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    lookToward: (x: number, y: number) => {
      if (imageFailed) {
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

  // Slow, steady breathing.
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

  // Aura: gentle pulse normally, brighter and faster while speaking.
  useEffect(() => {
    const duration = speaking ? 900 : 3000;
    const peak = speaking ? 1 : listening ? 0.7 : 0.45;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: peak,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: peak * 0.4,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [speaking, listening, glow]);

  // Gentle idle drift, as if quietly attentive.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!idle.current) return;
      Animated.parallel([
        Animated.timing(gazeX, {
          toValue: (Math.random() - 0.5) * 0.5,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(gazeY, {
          toValue: (Math.random() - 0.5) * 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 4200);
    return () => clearInterval(interval);
  }, [gazeX, gazeY]);

  if (imageFailed) {
    return (
      <JesusFace
        ref={fallbackRef}
        size={size}
        listening={listening}
        speaking={speaking}
      />
    );
  }

  const breathScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015],
  });
  const leanX = gazeX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
  });
  const leanY = gazeY.interpolate({
    inputRange: [-1, 1],
    outputRange: [-4, 4],
  });
  const tilt = gazeX.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-1.5deg', '1.5deg'],
  });

  return (
    <Animated.View style={{ width: size, height }}>
      {/* Golden aura behind the portrait */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: glow }]}>
        <Svg width={size} height={height}>
          <Defs>
            <RadialGradient id="aura" cx="50%" cy="42%" r="60%">
              <Stop offset="0%" stopColor="#F7D774" stopOpacity="0.8" />
              <Stop offset="60%" stopColor="#F7D774" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#F7D774" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={height * 0.45} r={size * 0.62} fill="url(#aura)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.portraitFrame,
          {
            borderRadius: size * 0.09,
            transform: [
              { translateX: leanX },
              { translateY: leanY },
              { rotate: tilt },
              { scale: breathScale },
            ],
          },
        ]}
      >
        <Image
          source={{ uri: PORTRAIT_URL }}
          style={styles.portrait}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
        {/* Vignette so the portrait melts into the dark background */}
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <RadialGradient id="vignette" cx="50%" cy="45%" r="72%">
              <Stop offset="0%" stopColor="#141B2E" stopOpacity="0" />
              <Stop offset="78%" stopColor="#141B2E" stopOpacity="0" />
              <Stop offset="100%" stopColor="#141B2E" stopOpacity="0.9" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#vignette)" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  portraitFrame: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#1D2740',
  },
  portrait: {
    width: '100%',
    height: '100%',
  },
});

export default JesusPortrait;
