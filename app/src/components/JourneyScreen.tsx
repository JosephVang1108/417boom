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
import { PREMIUM_UNLOCKED } from '../lib/config';
import * as journal from '../lib/journal';
import { RECORDED_SERMONS, RecordedSermon } from '../lib/media';
import {
  Badge,
  daysTogether,
  getBadges,
  getStats,
  JourneyStats,
  loadStats,
  MEDALLIONS,
} from '../lib/stats';
import Medallion from './Medallion';
import SermonTheater from './SermonTheater';

interface Props {
  visible: boolean;
  streak: number;
  onClose: () => void;
  onOpenBible: () => void;
  onOpenDevotional: (date?: Date) => void;
  onTellStory: (ask: string) => void;
  onSermon: () => void;
}

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif' });

// The story shelf, in order of popularity. The first is free; the rest
// unlock with Premium at launch. (For now he'll still tell any story
// you ask him for out loud — this shelf is the browsing experience.)
const STORIES: {
  title: string;
  ask: string;
  emoji: string;
  icon: number;
  free?: boolean;
}[] = [
  { title: 'David & Goliath', ask: 'David and Goliath', emoji: '🪨', icon: require('../../assets/media/s-david.jpg'), free: true },
  { title: 'The Birth of Jesus', ask: 'the birth of Jesus', emoji: '⭐', icon: require('../../assets/media/s-nativity.jpg') },
  { title: 'The Resurrection', ask: 'the resurrection of Jesus', emoji: '🌅', icon: require('../../assets/media/s-resurrection.jpg') },
  { title: 'Noah & the Flood', ask: 'Noah and the flood', emoji: '🌈', icon: require('../../assets/media/s-noah.jpg') },
  { title: 'The Exodus', ask: 'the Exodus', emoji: '🌊', icon: require('../../assets/media/s-exodus.jpg') },
  { title: "Daniel in the Lions' Den", ask: "Daniel in the lions' den", emoji: '🦁', icon: require('../../assets/media/s-daniel.jpg') },
  { title: 'Jonah & the Great Fish', ask: 'Jonah and the great fish', emoji: '🐋', icon: require('../../assets/media/s-jonah.jpg') },
  { title: 'The Prodigal Son', ask: 'the prodigal son', emoji: '🏡', icon: require('../../assets/media/s-prodigal.jpg') },
  { title: 'Creation', ask: 'the creation of the world', emoji: '🌍', icon: require('../../assets/media/s-creation.jpg') },
  { title: 'Queen Esther', ask: 'Queen Esther', emoji: '💛', icon: require('../../assets/media/s-esther.jpg') },
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
  onSermon,
}: Props) {
  const [stats, setStats] = useState<JourneyStats>(getStats());
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [allBadgesOpen, setAllBadgesOpen] = useState(false);
  const [theater, setTheater] = useState<RecordedSermon | null>(null);

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
    if (s.free || PREMIUM_UNLOCKED) {
      onTellStory(s.ask);
      return;
    }
    Alert.alert(
      'This telling is waiting for you',
      'The full stories live in Jireh Premium — that’s what keeps this place open and growing. David & Goliath is yours anytime, and he’d love to tell it.'
    );
  };

  const badgeCard = (b: Badge) => (
    <View key={b.id} style={[styles.badge, !b.earned && styles.badgeLocked]}>
      <Medallion source={b.icon} size={54} fallback={b.emoji} />
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
            <Medallion source={MEDALLIONS.dove} size={52} fallback="🕊️" />
            <Text style={styles.streakBig}>Day {daysTogether()}</Text>
            <Text style={styles.streakTogether}>since you two met</Text>
            <Text style={styles.streakSub}>
              Streak {nowStreak} · best{' '}
              {Math.max(stats.bestStreak, streak)} · {stats.totalDays}{' '}
              {stats.totalDays === 1 ? 'day' : 'days'} with him ·{' '}
              {stats.perfectWeeks} perfect {stats.perfectWeeks === 1 ? 'week' : 'weeks'}
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
            <Medallion source={MEDALLIONS.book} size={26} fallback="📖" />
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
              source={MEDALLIONS.firstLight}
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

          {/* He preaches — one full sermon a day, free */}
          <Pressable style={styles.wordButton} onPress={onSermon}>
            <Medallion
              source={require('../../assets/media/m-scripture-seeker.jpg')}
              size={26}
              fallback="📜"
            />
            <View style={styles.bibleButtonBody}>
              <Text style={styles.wordButtonText}>Today's Sermon</Text>
              <Text style={styles.wordButtonSub}>
                He preaches on the day's theme — free, every day
              </Text>
            </View>
            <Text style={styles.rowArrowDark}>›</Text>
          </Pressable>

          {/* Recorded sermons — real renders of him preaching */}
          <Text style={styles.sectionTitle}>Watch him preach</Text>
          {RECORDED_SERMONS.map((s) => (
            <Pressable
              key={s.id}
              style={styles.wordButton}
              onPress={() => {
                if (!s.free && !PREMIUM_UNLOCKED) {
                  Alert.alert(
                    'This sermon is waiting for you',
                    'The full recorded library lives in Jireh Premium. "Come Back Home" is yours anytime, free.'
                  );
                  return;
                }
                setTheater(s);
              }}
            >
              <Medallion source={s.icon} size={26} fallback={s.emoji} />
              <View style={styles.bibleButtonBody}>
                <Text style={styles.wordButtonText}>{s.title}</Text>
                <Text style={styles.wordButtonSub}>
                  {s.tagline} · {s.minutes} min
                </Text>
              </View>
              <Text style={styles.rowArrowDark}>▶</Text>
            </Pressable>
          ))}

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
                <Medallion source={s.icon} size={50} fallback={s.emoji} />
                <Text style={styles.storyTitle}>{s.title}</Text>
                <Text
                  style={[
                    styles.storyTag,
                    (s.free || PREMIUM_UNLOCKED) && styles.storyTagFree,
                  ]}
                >
                  {PREMIUM_UNLOCKED ? 'PREMIUM ✦' : s.free ? 'FREE' : '🔒 PREMIUM'}
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
              {/* First tile: open the whole cabinet at once. */}
              <Pressable
                style={[styles.badge, styles.badgeAllTile]}
                onPress={() => setAllBadgesOpen(true)}
              >
                <Medallion source={MEDALLIONS.dove} size={54} fallback="🕊️" />
                <Text style={styles.badgeName}>See them all</Text>
                <Text style={styles.badgeDesc}>
                  {earned.length} earned · tap to view
                </Text>
              </Pressable>
              {badges.map(badgeCard)}
            </ScrollView>
          )}

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

        {/* The theater: mounted only while something is playing. */}
        {theater && (
          <SermonTheater
            title={theater.title}
            url={theater.url}
            onClose={() => setTheater(null)}
          />
        )}

        {/* The whole badge cabinet, all at once — earned first. */}
        <Modal
          visible={allBadgesOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAllBadgesOpen(false)}
        >
          <View style={styles.galleryBackdrop}>
            <View style={styles.galleryCard}>
              <View style={styles.galleryHeader}>
                <Text style={styles.galleryTitle}>
                  Your badges · {earned.length} of {badges.length}
                </Text>
                <Pressable
                  onPress={() => setAllBadgesOpen(false)}
                  hitSlop={12}
                >
                  <Text style={styles.headerButton}>Close</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.galleryGrid}>
                {[...badges]
                  .sort((a, b) => Number(b.earned) - Number(a.earned))
                  .map((b) => (
                    <View
                      key={b.id}
                      style={[
                        styles.gridBadge,
                        !b.earned && styles.badgeLocked,
                      ]}
                    >
                      <Medallion source={b.icon} size={48} fallback={b.emoji} />
                      <Text style={styles.gridBadgeName} numberOfLines={2}>
                        {b.name}
                      </Text>
                    </View>
                  ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  badgeAllTile: {
    backgroundColor: 'rgba(139,107,46,0.14)',
    borderColor: GOLD,
  },
  galleryBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  galleryCard: {
    backgroundColor: PAPER,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: EDGE,
    maxHeight: '82%',
    overflow: 'hidden',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: EDGE,
  },
  galleryTitle: {
    color: INK,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: SERIF,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    paddingBottom: 26,
  },
  gridBadge: {
    width: '29%',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#C9AE6E',
    alignItems: 'center',
  },
  gridBadgeName: {
    color: INK,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
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
