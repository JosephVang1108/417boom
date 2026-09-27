import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as journal from '../lib/journal';
import {
  Badge,
  getBadges,
  getStats,
  JourneyStats,
  loadStats,
} from '../lib/stats';

interface Props {
  visible: boolean;
  streak: number;
  onClose: () => void;
}

/**
 * Your Journey: the walk so far — streak, lifetime moments, badges
 * earned and still ahead, and the prayers recently carried together.
 */
export default function JourneyScreen({ visible, streak, onClose }: Props) {
  const [stats, setStats] = useState<JourneyStats>(getStats());

  useEffect(() => {
    if (visible) loadStats().then((s) => setStats({ ...s }));
  }, [visible]);

  const badges = getBadges(stats);
  const earned = badges.filter((b) => b.earned);
  const prayers = journal.getJournal().slice(0, 3);

  // Progress toward the next streak badge.
  const streakGoals: { target: number; label: string }[] = [
    { target: 3, label: '🕊️ Three Days Walking' },
    { target: 7, label: '🔥 Week of Grace' },
    { target: 30, label: '⭐ Faithful Month' },
    { target: 100, label: '👑 Hundredfold' },
  ];
  const nowStreak = Math.max(streak, 1);
  const nextGoal = streakGoals.find((g) => g.target > nowStreak);

  const badgeCard = (b: Badge) => (
    <View key={b.id} style={[styles.badge, !b.earned && styles.badgeLocked]}>
      <Text style={styles.badgeEmoji}>{b.emoji}</Text>
      <Text style={styles.badgeName}>{b.name}</Text>
      <Text style={styles.badgeDesc}>{b.desc}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Soft dawn glow at the top of the page */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="journeyDawn" cx="50%" cy="8%" r="60%">
              <Stop offset="0%" stopColor="#B9964E" stopOpacity="0.22" />
              <Stop offset="60%" stopColor="#B9964E" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="8%" r="60%" fill="url(#journeyDawn)" />
        </Svg>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Journey</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.headerButton}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.streakCard}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={styles.streakBig}>Day {nowStreak}</Text>
            <Text style={styles.streakTogether}>walking together</Text>
            <Text style={styles.streakSub}>
              Best streak {Math.max(stats.bestStreak, streak)} · {stats.totalDays}{' '}
              {stats.totalDays === 1 ? 'day' : 'days'} in all
            </Text>
            {nextGoal && (
              <View style={styles.goalWrap}>
                <View style={styles.goalTrack}>
                  <View
                    style={[
                      styles.goalFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.round((nowStreak / nextGoal.target) * 100)
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.goalText}>
                  {nextGoal.target - nowStreak}{' '}
                  {nextGoal.target - nowStreak === 1 ? 'day' : 'days'} to{' '}
                  {nextGoal.label}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.countRow}>
            <View style={styles.countCard}>
              <Text style={styles.countNum}>{stats.prayers}</Text>
              <Text style={styles.countLabel}>prayers</Text>
            </View>
            <View style={styles.countCard}>
              <Text style={styles.countNum}>{stats.chapters}</Text>
              <Text style={styles.countLabel}>chapters</Text>
            </View>
            <View style={styles.countCard}>
              <Text style={styles.countNum}>{stats.stories}</Text>
              <Text style={styles.countLabel}>stories</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            Badges · {earned.length} of {badges.length}
          </Text>
          <View style={styles.badgeGrid}>{badges.map(badgeCard)}</View>

          {prayers.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Prayers we're carrying</Text>
              {prayers.map((p) => (
                <View key={p.id} style={styles.prayerCard}>
                  <Text style={styles.prayerText} numberOfLines={2}>
                    {p.request}
                  </Text>
                  <Text style={styles.prayerDate}>
                    {new Date(p.date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </>
          )}

          <Text style={styles.footerNote}>
            Every day you open the app, every prayer, every chapter and
            story counts. Keep walking.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#F0E6CE',
    fontSize: 17,
    fontWeight: '600',
  },
  headerButton: {
    color: '#B9964E',
    fontSize: 15,
  },
  content: {
    padding: 18,
    paddingBottom: 48,
  },
  streakCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(185,150,78,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(185,150,78,0.45)',
    shadowColor: '#B9964E',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  streakFlame: {
    fontSize: 30,
  },
  streakBig: {
    color: '#F0E6CE',
    fontSize: 40,
    fontWeight: '700',
    marginTop: 4,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  streakTogether: {
    color: '#C8A45C',
    fontSize: 14,
    marginTop: 2,
  },
  streakSub: {
    color: '#9A9A90',
    fontSize: 12,
    marginTop: 10,
  },
  goalWrap: {
    width: '100%',
    marginTop: 16,
  },
  goalTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#B9964E',
  },
  goalText: {
    color: '#C8A45C',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  countRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  countCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  countNum: {
    color: '#F0E6CE',
    fontSize: 22,
    fontWeight: '700',
  },
  countLabel: {
    color: '#9A9A90',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#C8A45C',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 26,
    marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    width: '47.5%',
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(185,150,78,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(185,150,78,0.5)',
    alignItems: 'center',
    shadowColor: '#B9964E',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  badgeLocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.45,
    shadowOpacity: 0,
  },
  badgeEmoji: {
    fontSize: 30,
  },
  badgeName: {
    color: '#F0E6CE',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  badgeDesc: {
    color: '#9A9A90',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  prayerCard: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  prayerText: {
    color: '#E4E4DC',
    fontSize: 14,
  },
  prayerDate: {
    color: '#6E6E66',
    fontSize: 11,
    marginTop: 4,
  },
  footerNote: {
    color: '#6E6E66',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
});
