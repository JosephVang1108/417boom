import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export interface JesusFaceHandle {
  /** Point the gaze toward a direction, each axis in [-1, 1]. */
  lookToward: (x: number, y: number) => void;
  /** Return the gaze to a gentle idle wander. */
  rest: () => void;
}

interface Props {
  size?: number; // rendered width in px; art is on a 200 x 240 canvas
  listening?: boolean;
  speaking?: boolean;
}

// Art coordinates on the 200 x 240 canvas.
const EYE_Y = 105;
const LEFT_EYE_X = 77;
const RIGHT_EYE_X = 123;
const MOUTH_X = 100;
const MOUTH_Y = 149;

const JesusFace = forwardRef<JesusFaceHandle, Props>(function JesusFace(
  { size = 300, listening = false, speaking = false },
  ref
) {
  const s = size / 200;
  const height = size * 1.2;

  const gazeX = useRef(new Animated.Value(0)).current;
  const gazeY = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current; // 1 open, 0 closed
  const mouthOpen = useRef(new Animated.Value(0)).current;
  const browRaise = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  const idle = useRef(true);
  const restTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookToward = (x: number, y: number) => {
    idle.current = false;
    if (restTimer.current) clearTimeout(restTimer.current);
    Animated.parallel([
      Animated.spring(gazeX, {
        toValue: Math.max(-1, Math.min(1, x)),
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
      Animated.spring(gazeY, {
        toValue: Math.max(-1, Math.min(1, y)),
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
    ]).start();
    // Drift back to idle wandering if untouched for a while.
    restTimer.current = setTimeout(() => {
      idle.current = true;
    }, 4000);
  };

  const restGaze = () => {
    idle.current = true;
    Animated.parallel([
      Animated.spring(gazeX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(gazeY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  useImperativeHandle(ref, () => ({ lookToward, rest: restGaze }));

  // Gentle idle wander.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!idle.current) return;
      const tx = (Math.random() - 0.5) * 1.0;
      const ty = (Math.random() - 0.5) * 0.6;
      Animated.parallel([
        Animated.timing(gazeX, {
          toValue: tx,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(gazeY, {
          toValue: ty,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 3200);
    return () => clearInterval(interval);
  }, [gazeX, gazeY]);

  // Blinking.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const scheduleBlink = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        Animated.sequence([
          Animated.timing(blink, {
            toValue: 0.06,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 110,
            useNativeDriver: true,
          }),
        ]).start(() => scheduleBlink());
      }, 2200 + Math.random() * 3500);
    };
    scheduleBlink();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [blink]);

  // Mouth movement + slight head bob while speaking.
  useEffect(() => {
    if (speaking) {
      const talk = Animated.loop(
        Animated.sequence([
          Animated.timing(mouthOpen, {
            toValue: 1,
            duration: 140,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(mouthOpen, {
            toValue: 0.25,
            duration: 160,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(mouthOpen, {
            toValue: 0.8,
            duration: 120,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(mouthOpen, {
            toValue: 0.15,
            duration: 180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      const sway = Animated.loop(
        Animated.sequence([
          Animated.timing(bob, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      talk.start();
      sway.start();
      return () => {
        talk.stop();
        sway.stop();
        Animated.timing(mouthOpen, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
        Animated.timing(bob, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };
    }
  }, [speaking, mouthOpen, bob]);

  // Raised, attentive brows while listening.
  useEffect(() => {
    Animated.spring(browRaise, {
      toValue: listening ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [listening, browRaise]);

  const pupilShiftX = gazeX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-4.5 * s, 4.5 * s],
  });
  const pupilShiftY = gazeY.interpolate({
    inputRange: [-1, 1],
    outputRange: [-2.5 * s, 2.5 * s],
  });
  const headShiftX = gazeX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-3 * s, 3 * s],
  });
  const headTilt = gazeX.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2.5deg', '2.5deg'],
  });
  const bobShift = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2.5 * s],
  });
  const browShift = browRaise.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3 * s],
  });
  const mouthScale = mouthOpen.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const eye = (cx: number) => (
    <Animated.View
      key={cx}
      style={[
        styles.eye,
        {
          left: (cx - 10) * s,
          top: (EYE_Y - 6.5) * s,
          width: 20 * s,
          height: 13 * s,
          borderRadius: 8 * s,
          transform: [{ scaleY: blink }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.iris,
          {
            width: 9 * s,
            height: 9 * s,
            borderRadius: 5 * s,
            transform: [{ translateX: pupilShiftX }, { translateY: pupilShiftY }],
          },
        ]}
      >
        <View
          style={[
            styles.pupil,
            { width: 4 * s, height: 4 * s, borderRadius: 2.5 * s },
          ]}
        />
        <View
          style={[
            styles.glint,
            {
              width: 2.4 * s,
              height: 2.4 * s,
              borderRadius: 1.5 * s,
              top: 1.2 * s,
              right: 1.2 * s,
            },
          ]}
        />
      </Animated.View>
    </Animated.View>
  );

  const brow = (cx: number, angle: string) => (
    <Animated.View
      key={`brow-${cx}`}
      style={[
        styles.brow,
        {
          left: (cx - 12) * s,
          top: 91 * s,
          width: 24 * s,
          height: 3.6 * s,
          borderRadius: 2 * s,
          transform: [{ translateY: browShift }, { rotate: angle }],
        },
      ]}
    />
  );

  return (
    <Animated.View
      style={{
        width: size,
        height,
        transform: [
          { translateX: headShiftX },
          { translateY: bobShift },
          { rotate: headTilt },
        ],
      }}
    >
      <Svg width={size} height={height} viewBox="0 0 200 240">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="45%" r="55%">
            <Stop offset="0%" stopColor="#F7D774" stopOpacity="0.55" />
            <Stop offset="60%" stopColor="#F7D774" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#F7D774" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Radiance behind the figure */}
        <Circle cx="100" cy="105" r="98" fill="url(#glow)" />
        {/* Halo */}
        <Circle
          cx="100"
          cy="72"
          r="55"
          stroke="#F0C860"
          strokeWidth="2.5"
          strokeOpacity={listening ? 0.75 : 0.4}
          fill="none"
        />

        {/* Robe / shoulders */}
        <Path
          d="M 28 240 C 38 204 68 190 100 190 C 132 190 162 204 172 240 Z"
          fill="#F1E9D6"
        />
        <Path
          d="M 92 196 L 100 214 L 108 196 C 106 192 94 192 92 196 Z"
          fill="#C8574B"
          opacity="0.85"
        />

        {/* Face */}
        <Ellipse cx="100" cy="105" rx="52" ry="62" fill="#E8C39E" />

        {/* Hair — long, center-parted */}
        <Path
          d="M 100 28
             C 58 28 42 62 45 96
             C 46 132 50 170 41 206
             L 63 206
             C 57 170 57 132 58 104
             C 66 84 134 84 142 104
             C 143 132 143 170 137 206
             L 159 206
             C 150 170 154 132 155 96
             C 158 62 142 28 100 28 Z"
          fill="#5A4232"
        />

        {/* Beard */}
        <Path
          d="M 55 116
             C 57 166 76 194 100 196
             C 124 194 143 166 145 116
             C 138 150 122 163 100 163
             C 78 163 62 150 55 116 Z"
          fill="#5A4232"
        />

        {/* Mustache */}
        <Path
          d="M 82 143 Q 91 136 99 142 Q 97 147 90 147 Q 85 147 82 143 Z"
          fill="#5A4232"
        />
        <Path
          d="M 118 143 Q 109 136 101 142 Q 103 147 110 147 Q 115 147 118 143 Z"
          fill="#5A4232"
        />

        {/* Nose */}
        <Path
          d="M 98 112 C 96 121 94 127 97 130 C 99 132 103 132 105 129"
          stroke="#C89B72"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Resting smile */}
        <Path
          d="M 89 150 Q 100 157 111 150"
          stroke="#8A5A44"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {/* Animated overlays: eyes, brows, talking mouth */}
      {eye(LEFT_EYE_X)}
      {eye(RIGHT_EYE_X)}
      {brow(LEFT_EYE_X, '-5deg')}
      {brow(RIGHT_EYE_X, '5deg')}
      <Animated.View
        style={[
          styles.mouth,
          {
            left: (MOUTH_X - 8) * s,
            top: (MOUTH_Y + 1) * s,
            width: 16 * s,
            height: 13 * s,
            borderRadius: 8 * s,
            opacity: mouthOpen,
            transform: [{ scaleY: mouthScale }],
          },
        ]}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  eye: {
    position: 'absolute',
    backgroundColor: '#FDF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iris: {
    backgroundColor: '#6B4A2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    backgroundColor: '#241608',
  },
  glint: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  brow: {
    position: 'absolute',
    backgroundColor: '#4A3527',
  },
  mouth: {
    position: 'absolute',
    backgroundColor: '#5E3128',
  },
});

export default JesusFace;
