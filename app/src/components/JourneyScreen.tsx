import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Journey</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.headerButton}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.streakCard}>
            <Text style={styles.streakBig}>
              {streak > 0 ? `Day ${streak} together` : 'Day 1 together'}
            </Text>
            <Text style={styles.streakSub}>
              Best streak {Math.max(stats.bestStreak, streak)} · {stats.totalDays}{' '}
              {stats.totalDays === 1 ? 'day' : 'days'} walked in all
            </Text>
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
    paddingVertical: 22,
    borderRadius: 18,
    backgroundColor: 'rgba(185,150,78,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(185,150,78,0.4)',
  },
  streakBig: {
    color: '#F0E6CE',
    fontSize: 26,
    fontWeight: '700',
  },
  streakSub: {
    color: '#C8A45C',
    fontSize: 13,
    marginTop: 6,
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
    backgroundColor: 'rgba(185,150,78,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(185,150,78,0.45)',
    alignItems: 'center',
  },
  badgeLocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.45,
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
