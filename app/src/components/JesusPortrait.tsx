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

// Realistic 4K portrait generated with OpenArt (Nano Banana 2),
// re-lit against pure black so it blends into the app background.
// TODO: bundle this file locally before a store release.
export const PORTRAIT_URL =
  'https://cdn.openart.ai/openart-ai/production/2026-08/create-image/JZMxRtTkpmFe2dgMdSQI/image_1787807278217_1afe6b3c_1787807280459_5703c9a4.png';

interface Props {
  width: number;
  height: number;
  listening?: boolean;
  speaking?: boolean;
}

/**
 * Full-bleed portrait: fills the screen against pure black, breathes
 * slowly, a heavenly glow pulses (stronger while speaking), and he
 * leans gently toward touch. Falls back to the drawn animated face if
 * the image cannot load (e.g. no internet on first run).
 */
const JesusPortrait = forwardRef<JesusFaceHandle, Props>(function JesusPortrait(
  { width, height, listening = false, speaking = false },
  ref
) {
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

  // Gentle idle drift, as if quietly attentive.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!idle.current) return;
      Animated.parallel([
        Animated.timing(gazeX, {
          toValue: (Math.random() - 0.5) * 0.5,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(gazeY, {
          toValue: (Math.random() - 0.5) * 0.3,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 4200);
    return () => clearInterval(interval);
  }, [gazeX, gazeY]);

  if (imageFailed) {
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
            transform: [
              { translateX: leanX },
              { translateY: leanY },
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
