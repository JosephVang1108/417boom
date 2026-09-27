import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { DailyVerse, getTodaysDevotional } from '../lib/dailyVerse';
import { MEDALLIONS } from '../lib/stats';
import Medallion from './Medallion';

interface Props {
  visible: boolean;
  streak: number;
  onDone: () => void;
}

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif' });

/**
 * The morning moment: today's date, a scripture, what it means, and an
 * Amen. Saying Amen blooms a golden ring and celebrates the streak,
 * then returns to him. Shown once per day.
 */
export default function DailyDevotional({ visible, streak, onDone }: Props) {
  const [devotional, setDevotional] = useState<DailyVerse | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const enter = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.25)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const dayScale = useRef(new Animated.Value(0.6)).current;
  const dayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setDevotional(getTodaysDevotional());
      setCelebrating(false);
      enter.setValue(0);
      Animated.timing(enter, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const amen = () => {
    setCelebrating(true);
    ringScale.setValue(0.25);
    ringOpacity.setValue(0.9);
    dayScale.setValue(0.6);
    dayOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(ringScale, {
        toValue: 1.25,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(dayScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(dayOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(onDone, 2100);
  };

  if (!devotional) return null;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.root}>
        {/* Soft dawn glow behind everything */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="dawn" cx="50%" cy="18%" r="75%">
              <Stop offset="0%" stopColor="#B9964E" stopOpacity="0.28" />
              <Stop offset="55%" stopColor="#B9964E" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="18%" r="75%" fill="url(#dawn)" />
        </Svg>

        {!celebrating ? (
          <Animated.View
            style={[
              styles.card,
              {
                opacity: enter,
                transform: [
                  {
                    translateY: enter.interpolate({
                      inputRange: [0, 1],
                      outputRange: [26, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.date}>{today.toUpperCase()}</Text>
            <View style={styles.divider} />
            <Text style={styles.verseText}>“{devotional.text}”</Text>
            <Text style={styles.verseRef}>{devotional.ref}</Text>

            <Text style={styles.meaningLabel}>WHAT IT MEANS</Text>
            <Text style={styles.meaningText}>{devotional.meaning}</Text>

            <Pressable style={styles.amenButton} onPress={amen}>
              <Medallion
                uri={MEDALLIONS.prayingHands}
                size={22}
                fallback="🙏"
              />
              <Text style={styles.amenText}>Amen</Text>
            </Pressable>
            <Pressable onPress={onDone} hitSlop={10}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.celebrateWrap}>
            <Animated.View
              style={[
                styles.ring,
                { opacity: ringOpacity, transform: [{ scale: ringScale }] },
              ]}
            />
            <Animated.View
              style={{
                opacity: dayOpacity,
                transform: [{ scale: dayScale }],
                alignItems: 'center',
              }}
            >
              <Text style={styles.celebrateDay}>
                Day {Math.max(streak, 1)}
              </Text>
              <Text style={styles.celebrateSub}>walking together</Text>
            </Animated.View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    paddingHorizontal: 34,
    alignItems: 'center',
  },
  date: {
    color: '#C8A45C',
    fontSize: 13,
    letterSpacing: 3,
    fontWeight: '600',
  },
  divider: {
    width: 44,
    height: 1,
    backgroundColor: 'rgba(185,150,78,0.6)',
    marginTop: 14,
    marginBottom: 28,
  },
  verseText: {
    color: '#F0E6CE',
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'center',
    fontFamily: SERIF,
    fontStyle: 'italic',
  },
  verseRef: {
    color: '#B9964E',
    fontSize: 14,
    marginTop: 16,
    letterSpacing: 1,
  },
  meaningLabel: {
    color: '#6E6E66',
    fontSize: 11,
    letterSpacing: 2.5,
    marginTop: 36,
    marginBottom: 10,
  },
  meaningText: {
    color: '#C9C9C2',
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
  },
  amenButton: {
    marginTop: 40,
    backgroundColor: '#B9964E',
    borderRadius: 26,
    paddingVertical: 13,
    paddingHorizontal: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#B9964E',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  amenText: {
    color: '#0A0A0A',
    fontSize: 17,
    fontWeight: '700',
  },
  laterText: {
    color: '#6E6E66',
    fontSize: 14,
    marginTop: 22,
  },
  celebrateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: '#F7D774',
    shadowColor: '#F7D774',
    shadowOpacity: 0.8,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  celebrateDay: {
    color: '#F0E6CE',
    fontSize: 40,
    fontWeight: '700',
    fontFamily: SERIF,
  },
  celebrateSub: {
    color: '#C8A45C',
    fontSize: 15,
    marginTop: 6,
  },
});
