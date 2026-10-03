import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { recentMornings } from '../lib/dailyVerse';
import * as journal from '../lib/journal';
import {
  Badge,
  getBadges,
  getStats,
  JourneyStats,
  loadStats,
  MEDALLIONS,
} from '../lib/stats';
import Medallion from './Medallion';

interface Props {
  visible: boolean;
  streak: number;
  onClose: () => void;
  onOpenBible: () => void;
  onOpenDevotional: (date?: Date) => void;
  onTellStory: (ask: string) => void;
}

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif' });

// The story shelf, in order of popularity. The first is free; the rest
// unlock with Premium at launch. (For now he'll still tell any story
// you ask him for out loud — this shelf is the browsing experience.)
const STORY_ART = (hash: string) => `https://g.tlcdn.com/gen/${hash}.jpg`;
const STORIES: {
  title: string;
  ask: string;
  emoji: string;
  icon: string;
  free?: boolean;
}[] = [
  { title: 'David & Goliath', ask: 'David and Goliath', emoji: '🪨', icon: STORY_ART('721dff69351842afbb6590271f8d5620'), free: true },
  { title: 'The Birth of Jesus', ask: 'the birth of Jesus', emoji: '⭐', icon: STORY_ART('9b36428081044649b5951e7fff2fc649') },
  { title: 'The Resurrection', ask: 'the resurrection of Jesus', emoji: '🌅', icon: STORY_ART('4d3623c4acfb4f3dba19a00bf58423b8') },
  { title: 'Noah & the Flood', ask: 'Noah and the flood', emoji: '🌈', icon: STORY_ART('1f2f51e55be9451085df14b7408ebf9b') },
  { title: 'The Exodus', ask: 'the Exodus', emoji: '🌊', icon: STORY_ART('62f00aabf4a14804a95a2afb73e881b4') },
  { title: "Daniel in the Lions' Den", ask: "Daniel in the lions' den", emoji: '🦁', icon: STORY_ART('c0015747e48345e0827ded2500e761c1') },
  { title: 'Jonah & the Great Fish', ask: 'Jonah and the great fish', emoji: '🐋', icon: STORY_ART('e4cd7aa3bda042a9bc4d472ac92887be') },
  { title: 'The Prodigal Son', ask: 'the prodigal son', emoji: '🏡', icon: STORY_ART('34e6a66e7fbf4d9ca97375162c6e2d55') },
  { title: 'Creation', ask: 'the creation of the world', emoji: '🌍', icon: STORY_ART('e3994a1fb3f44586b31a0c8f9c5d5968') },
  { title: 'Queen Esther', ask: 'Queen Esther', emoji: '💛', icon: STORY_ART('81f4f79ca7c04fdcb026a7fb5c3bdf57') },
];

/**
 * Your Journey: a warm parchment page — the walk so far, a door into
 * the Bible, the story shelf, badges in a carousel, recent prayers.
 */
export default function JourneyScreen({
  visible,
  streak,
  onClose,
  onOpenBible,
  onOpenDevotional,
  onTellStory,
}: Props) {
  const [stats, setStats] = useState<JourneyStats>(getStats());
  const [badgesOpen, setBadgesOpen] = useState(false);

  useEffect(() => {
    if (visible) loadStats().then((s) => setStats({ ...s }));
  }, [visible]);

  const badges = getBadges(stats);
  const earned = badges.filter((b) => b.earned);
  const prayers = journal.getJournal().slice(0, 3);

  const streakGoals: { target: number; label: string }[] = [
    { target: 3, label: 'Three Days Walking' },
    { target: 7, label: 'Week of Grace' },
    { target: 30, label: 'Faithful Month' },
    { target: 100, label: 'Hundredfold' },
  ];
  const nowStreak = Math.max(streak, 1);
  const nextGoal = streakGoals.find((g) => g.target > nowStreak);

  const openStory = (s: (typeof STORIES)[number]) => {
    if (s.free) {
      onTellStory(s.ask);
      return;
    }
    Alert.alert(
      'This telling is waiting for you',
      'The full stories live in Abba Premium — that’s what keeps this place open and growing. David & Goliath is yours anytime, and he’d love to tell it.'
    );
  };

  const badgeCard = (b: Badge) => (
    <View key={b.id} style={[styles.badge, !b.earned && styles.badgeLocked]}>
      <Medallion uri={b.icon} size={54} fallback={b.emoji} />
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
          {/* The walk so far */}
          <View style={styles.streakCard}>
            <Medallion uri={MEDALLIONS.dove} size={52} fallback="🕊️" />
            <Text style={styles.streakBig}>Day {nowStreak}</Text>
            <Text style={styles.streakTogether}>walking together</Text>
            <Text style={styles.streakSub}>
              Best streak {Math.max(stats.bestStreak, streak)} ·{' '}
              {stats.totalDays} {stats.totalDays === 1 ? 'day' : 'days'} in all
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

          {/* Straight into the Word */}
          <Pressable style={styles.bibleButton} onPress={onOpenBible}>
            <Medallion uri={MEDALLIONS.book} size={26} fallback="📖" />
            <View style={styles.bibleButtonBody}>
              <Text style={styles.bibleButtonText}>Open the Bible</Text>
              <Text style={styles.bibleButtonSub}>
                Read, or have it read to you
              </Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </Pressable>

          {/* Today's devotional, anytime */}
          <Pressable
            style={styles.wordButton}
            onPress={() => onOpenDevotional()}
          >
            <Medallion
              uri={'https://g.tlcdn.com/gen/3785b1ad19964d7c8f776b37b08906f7.jpg'}
              size={26}
              fallback="🌅"
            />
            <View style={styles.bibleButtonBody}>
              <Text style={styles.wordButtonText}>Today's Word</Text>
              <Text style={styles.wordButtonSub}>
                The day's verse, and what it means
              </Text>
            </View>
            <Text style={styles.rowArrowDark}>›</Text>
          </Pressable>

          {/* Lifetime moments */}
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
            <View style={styles.countCard}>
              <Text style={styles.countNum}>{stats.shares}</Text>
              <Text style={styles.countLabel}>shared</Text>
            </View>
          </View>

          {/* Stories he can tell */}
          <Text style={styles.sectionTitle}>Stories he tells</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {STORIES.map((s) => (
              <Pressable
                key={s.title}
                style={styles.storyCard}
                onPress={() => openStory(s)}
              >
                <Medallion uri={s.icon} size={50} fallback={s.emoji} />
                <Text style={styles.storyTitle}>{s.title}</Text>
                <Text style={[styles.storyTag, s.free && styles.storyTagFree]}>
                  {s.free ? 'FREE' : '🔒 PREMIUM'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Badges, tucked into a drawer */}
          <Pressable
            style={styles.badgeHeader}
            onPress={() => setBadgesOpen((o) => !o)}
          >
            <Text style={styles.sectionTitle}>
              Badges · {earned.length} of {badges.length}
            </Text>
            <Text style={styles.badgeChevron}>{badgesOpen ? '▾' : '▸'}</Text>
          </Pressable>
          {badgesOpen && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {badges.map(badgeCard)}
            </ScrollView>
          )}

          {/* Mornings worth returning to */}
          <Text style={styles.sectionTitle}>Past mornings</Text>
          <View style={styles.groupCardLike}>
            {recentMornings(7).map((m, i) => (
              <Pressable
                key={m.date.toDateString()}
                style={[styles.morningRow, i < 6 && styles.morningRowLine]}
                onPress={() => onOpenDevotional(m.date)}
              >
                <Text style={styles.morningDay}>
                  {i === 0
                    ? 'Today'
                    : m.date.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                </Text>
                <Text style={styles.morningRef}>{m.verse.ref}</Text>
              </Pressable>
            ))}
          </View>

          {/* Prayers being carried */}
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
            Every day you open the app, every prayer, chapter, story, and
            verse you share counts. Keep walking.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

// A warm parchment palette — like the page of a well-loved Bible.
const PAPER = '#F4EBD8';
const CARD = '#FBF5E7';
const EDGE = '#D9C7A1';
const INK = '#3E3121';
const INK_SOFT = '#8A7A5C';
const GOLD = '#8B6B2E';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAPER,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: EDGE,
  },
  headerTitle: {
    color: INK,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: SERIF,
  },
  headerButton: {
    color: GOLD,
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
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: EDGE,
    shadowColor: '#8B6B2E',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  streakDove: {
    fontSize: 30,
  },
  streakBig: {
    color: INK,
    fontSize: 42,
    fontWeight: '700',
    marginTop: 4,
    fontFamily: SERIF,
  },
  streakTogether: {
    color: GOLD,
    fontSize: 14,
    marginTop: 2,
    fontStyle: 'italic',
    fontFamily: SERIF,
  },
  streakSub: {
    color: INK_SOFT,
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
    backgroundColor: 'rgba(139,107,46,0.15)',
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  goalText: {
    color: INK_SOFT,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  bibleButton: {
    marginTop: 14,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GOLD,
    shadowColor: '#8B6B2E',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bibleButtonBody: {
    flex: 1,
  },
  bibleButtonText: {
    color: '#FBF5E7',
    fontSize: 17,
    fontWeight: '700',
  },
  bibleButtonSub: {
    color: 'rgba(251,245,231,0.75)',
    fontSize: 12,
    marginTop: 3,
  },
  rowArrow: {
    color: '#FBF5E7',
    fontSize: 24,
  },
  rowArrowDark: {
    color: GOLD,
    fontSize: 24,
  },
  wordButton: {
    marginTop: 10,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: EDGE,
  },
  wordButtonText: {
    color: INK,
    fontSize: 16,
    fontWeight: '700',
  },
  wordButtonSub: {
    color: INK_SOFT,
    fontSize: 12,
    marginTop: 3,
  },
  countRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  countCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: EDGE,
  },
  countNum: {
    color: INK,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: SERIF,
  },
  countLabel: {
    color: INK_SOFT,
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 26,
    marginBottom: 12,
    fontFamily: SERIF,
  },
  carousel: {
    gap: 10,
    paddingRight: 18,
  },
  storyCard: {
    width: 132,
    borderRadius: 16,
    padding: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: EDGE,
    alignItems: 'center',
  },
  storyEmoji: {
    fontSize: 28,
  },
  storyTitle: {
    color: INK,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    minHeight: 34,
  },
  storyTag: {
    color: INK_SOFT,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 6,
  },
  storyTagFree: {
    color: GOLD,
    fontWeight: '700',
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  badgeChevron: {
    color: GOLD,
    fontSize: 16,
    marginTop: 24,
  },
  badge: {
    width: 128,
    borderRadius: 16,
    padding: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#C9AE6E',
    alignItems: 'center',
  },
  badgeLocked: {
    borderColor: EDGE,
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeName: {
    color: INK,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  badgeDesc: {
    color: INK_SOFT,
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },
  groupCardLike: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: EDGE,
    overflow: 'hidden',
  },
  morningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  morningRowLine: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217,199,161,0.5)',
  },
  morningDay: {
    color: INK,
    fontSize: 14,
    fontWeight: '600',
  },
  morningRef: {
    color: INK_SOFT,
    fontSize: 13,
    fontFamily: SERIF,
  },
  prayerCard: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: EDGE,
    marginBottom: 8,
  },
  prayerText: {
    color: INK,
    fontSize: 14,
  },
  prayerDate: {
    color: INK_SOFT,
    fontSize: 11,
    marginTop: 4,
  },
  footerNote: {
    color: INK_SOFT,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
    fontStyle: 'italic',
    fontFamily: SERIF,
  },
});
