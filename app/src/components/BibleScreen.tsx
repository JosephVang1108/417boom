import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BibleBook,
  BibleVerse,
  fetchChapter,
  NEW_TESTAMENT,
  OLD_TESTAMENT,
} from '../data/bibleBooks';
import * as stats from '../lib/stats';
import { MEDALLIONS } from '../lib/stats';
import * as voice from '../lib/voice';
import Medallion from './Medallion';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Small first passage so reading starts within seconds; larger after.
// While one passage plays, the next is generated in the background.
const FIRST_CHUNK_CHARS = 350;
const CHUNK_CHARS = 1100;

const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];

// Organized the way a Bible's own table of contents is.
const OT_GROUPS = [
  { title: 'The Law', books: OLD_TESTAMENT.slice(0, 5) },
  { title: 'History', books: OLD_TESTAMENT.slice(5, 17) },
  { title: 'Wisdom & Poetry', books: OLD_TESTAMENT.slice(17, 22) },
  { title: 'The Prophets', books: OLD_TESTAMENT.slice(22) },
];
const NT_GROUPS = [
  { title: 'The Gospels', books: NEW_TESTAMENT.slice(0, 4) },
  { title: 'The Early Church', books: NEW_TESTAMENT.slice(4, 5) },
  { title: 'The Letters', books: NEW_TESTAMENT.slice(5, 26) },
  { title: 'Revelation', books: NEW_TESTAMENT.slice(26) },
];

const LAST_POS_KEY = 'bible_last_position';
const ORDER_KEY = 'bible_book_order';

// Timeline order: the books arranged by when their events happened,
// so a first-time reader can walk the story from beginning to end.
const byName = (names: string[]): BibleBook[] =>
  names
    .map((n) => ALL_BOOKS.find((b) => b.name === n))
    .filter((b): b is BibleBook => !!b);

const TIMELINE_GROUPS = [
  { title: 'Creation & the Patriarchs', books: byName(['Genesis', 'Job']) },
  { title: 'Out of Egypt', books: byName(['Exodus', 'Leviticus', 'Numbers', 'Deuteronomy']) },
  { title: 'Entering the Land', books: byName(['Joshua', 'Judges', 'Ruth']) },
  { title: 'The Kingdom Rises', books: byName(['1 Samuel', '2 Samuel', '1 Chronicles', 'Psalms']) },
  { title: 'Solomon & the Wisdom Years', books: byName(['1 Kings', '2 Chronicles', 'Proverbs', 'Ecclesiastes', 'Song of Solomon']) },
  { title: 'The Kingdom Divides · Prophets Speak', books: byName(['2 Kings', 'Obadiah', 'Joel', 'Jonah', 'Amos', 'Hosea', 'Isaiah', 'Micah', 'Nahum', 'Zephaniah', 'Jeremiah', 'Habakkuk', 'Lamentations']) },
  { title: 'Exile in Babylon', books: byName(['Ezekiel', 'Daniel']) },
  { title: 'The Return Home', books: byName(['Ezra', 'Haggai', 'Zechariah', 'Esther', 'Nehemiah', 'Malachi']) },
  { title: 'Jesus Walks the Earth', books: byName(['Matthew', 'Mark', 'Luke', 'John']) },
  { title: 'The Church Is Born', books: byName(['Acts', 'James', 'Galatians', '1 Thessalonians', '2 Thessalonians', '1 Corinthians', '2 Corinthians', 'Romans']) },
  { title: 'Letters to the Churches', books: byName(['Ephesians', 'Philippians', 'Colossians', 'Philemon', '1 Timothy', 'Titus', '2 Timothy', '1 Peter', '2 Peter', 'Hebrews', 'Jude', '1 John', '2 John', '3 John']) },
  { title: 'The End & the New Beginning', books: byName(['Revelation']) },
];

export default function BibleScreen({ visible, onClose }: Props) {
  const [book, setBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<BibleVerse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reading, setReading] = useState(false);
  const [readerId, setReaderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lastPos, setLastPos] = useState<{
    book: string;
    chapter: number;
  } | null>(null);
  const [order, setOrder] = useState<'traditional' | 'timeline'>('traditional');
  const readingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(LAST_POS_KEY)
        .then((raw) => raw && setLastPos(JSON.parse(raw)))
        .catch(() => {});
      AsyncStorage.getItem(ORDER_KEY)
        .then((raw) => raw === 'timeline' && setOrder('timeline'))
        .catch(() => {});
    }
  }, [visible]);

  const pickOrder = (o: 'traditional' | 'timeline') => {
    setOrder(o);
    AsyncStorage.setItem(ORDER_KEY, o).catch(() => {});
  };

  const continueReading = () => {
    if (!lastPos) return;
    const b = ALL_BOOKS.find((x) => x.name === lastPos.book);
    if (!b) return;
    setBook(b);
    setChapter(Math.min(lastPos.chapter, b.chapters));
  };

  const toggleVerse = (n: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  // Share the highlighted verses — and it counts toward the
  // sharing-light badges.
  const shareSelected = async () => {
    if (!verses || !book || !chapter || selected.size === 0) return;
    const nums = [...selected].sort((a, b) => a - b);
    const text = verses
      .filter((v) => selected.has(v.verse))
      .map((v) => v.text.trim())
      .join(' ');
    const ref =
      nums.length === 1
        ? `${book.name} ${chapter}:${nums[0]}`
        : `${book.name} ${chapter}:${nums[0]}–${nums[nums.length - 1]}`;
    try {
      const result = await Share.share({
        message: `“${text}” — ${ref}\n\nShared from Jireh 🙏`,
      });
      if (result.action === Share.sharedAction) {
        stats.bump('shares');
        setSelected(new Set());
      }
    } catch {
      // share sheet dismissed or unavailable — nothing to do
    }
  };

  useEffect(() => {
    if (visible) setReaderId(voice.getReaderVoice());
  }, [visible]);

  const pickReaderVoice = (id: string | null) => {
    if (readingRef.current) stopReading();
    setReaderId(id);
    voice.setReaderVoice(id);
  };

  useEffect(() => {
    if (book && chapter) {
      setLoading(true);
      setFailed(false);
      setVerses(null);
      setSelected(new Set());
      const pos = { book: book.name, chapter };
      setLastPos(pos);
      AsyncStorage.setItem(LAST_POS_KEY, JSON.stringify(pos)).catch(() => {});
      fetchChapter(book.name, chapter).then((v) => {
        setVerses(v);
        setFailed(!v);
        setLoading(false);
        if (v) stats.bump('chapters'); // counts toward Journey badges
      });
    }
  }, [book, chapter]);

  const stopReading = () => {
    readingRef.current = false;
    setReading(false);
    voice.stop();
  };

  const readAloud = () => {
    if (!verses || !book || !chapter) return;
    if (!voice.voiceAvailable()) {
      Alert.alert(
        'Voice needs ElevenLabs',
        'Add your ElevenLabs API key in ⚙️ settings to have chapters read aloud.'
      );
      return;
    }
    const readOptions = {
      read: true,
      ...(readerId ? { voice: readerId } : {}),
    };
    // Split the chapter into passages: a short opener so audio starts
    // within seconds, then larger ones generated while the previous plays.
    const chunks: string[] = [];
    let current = `${book.name}, chapter ${chapter}. … `;
    let limit = FIRST_CHUNK_CHARS;
    for (const v of verses) {
      if (current.length + v.text.length > limit && current.trim()) {
        chunks.push(current);
        current = '';
        limit = CHUNK_CHARS;
      }
      current += v.text + ' ';
    }
    if (current.trim()) chunks.push(current);

    readingRef.current = true;
    setReading(true);

    let upcoming = voice.synthesize(chunks[0], readOptions);
    const playFrom = async (i: number) => {
      const uri = await upcoming;
      if (!readingRef.current) return;
      if (!uri) {
        readingRef.current = false;
        setReading(false);
        Alert.alert(
          "Couldn't read aloud",
          'The voice service didn’t respond. Check your internet and ElevenLabs credits, then try again.'
        );
        return;
      }
      if (i + 1 < chunks.length)
        upcoming = voice.synthesize(chunks[i + 1], readOptions);
      voice.playUri(uri, () => {
        if (!readingRef.current) return;
        if (i + 1 < chunks.length) {
          playFrom(i + 1);
        } else {
          readingRef.current = false;
          setReading(false);
        }
      });
    };
    playFrom(0);
  };

  // Move to the adjacent chapter, flowing across book boundaries.
  const goChapter = (dir: 1 | -1) => {
    if (!book || chapter === null) return;
    stopReading();
    const target = chapter + dir;
    if (target >= 1 && target <= book.chapters) {
      setChapter(target);
      return;
    }
    const idx = ALL_BOOKS.findIndex((b) => b.name === book.name);
    const nextBook = ALL_BOOKS[idx + dir];
    if (!nextBook) return;
    setBook(nextBook);
    setChapter(dir === 1 ? 1 : nextBook.chapters);
  };

  const close = () => {
    stopReading();
    onClose();
  };

  const back = () => {
    stopReading();
    if (chapter !== null) {
      setChapter(null);
      setVerses(null);
    } else if (book !== null) {
      setBook(null);
    } else {
      close();
    }
  };

  // Each book is a worn leather spine; a group reads as a stack of
  // old bibles resting on each other, every volume jutting a little.
  const bookGroup = (title: string, books: BibleBook[]) => (
    <View key={title}>
      <Text style={styles.groupLabel}>{title.toUpperCase()}</Text>
      <View style={styles.stack}>
        {books.map((b, i) => {
          const leather = leatherFor(b.name);
          const inset = SPINE_INSETS[i % SPINE_INSETS.length];
          return (
            <Pressable
              key={b.name}
              style={[
                styles.spine,
                {
                  backgroundColor: leather.bg,
                  borderColor: leather.edge,
                  marginHorizontal: inset,
                },
              ]}
              onPress={() => setBook(b)}
            >
              <View style={styles.spineTooling} />
              <View style={styles.spineRow}>
                <Text style={styles.spineName} numberOfLines={1}>
                  {b.name}
                </Text>
                <Text style={styles.spineChapters}>{b.chapters}</Text>
              </View>
              <View style={styles.spineTooling} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const testament = (title: string, groups: typeof OT_GROUPS) => (
    <>
      <Text style={styles.testamentTitle}>{title}</Text>
      <View style={styles.testamentRule} />
      {groups.map((g) => bookGroup(g.title, g.books))}
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={back}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={back} hitSlop={12}>
            <Text style={styles.headerButton}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {book ? (chapter ? `${book.name} ${chapter}` : book.name) : 'The Bible'}
          </Text>
          <Pressable onPress={close} hitSlop={12}>
            <Text style={styles.headerButton}>Close</Text>
          </Pressable>
        </View>

        {!book && (
          <ScrollView contentContainerStyle={styles.content}>
            {lastPos && (
              <Pressable style={styles.continueCard} onPress={continueReading}>
                <View>
                  <Text style={styles.continueLabel}>CONTINUE READING</Text>
                  <Text style={styles.continueText}>
                    {lastPos.book} {lastPos.chapter}
                  </Text>
                </View>
                <Text style={styles.continueArrow}>›</Text>
              </Pressable>
            )}
            <View style={styles.orderRow}>
              <Pressable
                style={[
                  styles.orderChip,
                  order === 'traditional' && styles.orderChipActive,
                ]}
                onPress={() => pickOrder('traditional')}
              >
                <Text
                  style={[
                    styles.orderChipText,
                    order === 'traditional' && styles.orderChipTextActive,
                  ]}
                >
                  Traditional
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.orderChip,
                  order === 'timeline' && styles.orderChipActive,
                ]}
                onPress={() => pickOrder('timeline')}
              >
                <Text
                  style={[
                    styles.orderChipText,
                    order === 'timeline' && styles.orderChipTextActive,
                  ]}
                >
                  Timeline
                </Text>
              </Pressable>
            </View>
            {order === 'timeline' ? (
              <>
                <Text style={styles.timelineNote}>
                  The whole story, in the order it happened — from creation
                  to the new creation.
                </Text>
                {TIMELINE_GROUPS.map((g) => bookGroup(g.title, g.books))}
              </>
            ) : (
              <>
                {testament('The New Testament', NT_GROUPS)}
                {testament('The Old Testament', OT_GROUPS)}
              </>
            )}
            <Text style={styles.translationNote}>World English Bible (public domain)</Text>
          </ScrollView>
        )}

        {book && chapter === null && (
          <ScrollView contentContainerStyle={styles.content}>
            {/* The spine they tapped, now lying open before them. */}
            <View
              style={[
                styles.openSpine,
                {
                  backgroundColor: leatherFor(book.name).bg,
                  borderColor: leatherFor(book.name).edge,
                },
              ]}
            >
              <View style={styles.spineTooling} />
              <Text style={styles.openSpineTitle}>{book.name}</Text>
              <View style={styles.spineTooling} />
            </View>
            <Text style={styles.chapterCount}>
              {book.chapters} {book.chapters === 1 ? 'chapter' : 'chapters'}
            </Text>
            <View style={styles.grid}>
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
                <Pressable
                  key={c}
                  style={styles.chapterChip}
                  onPress={() => setChapter(c)}
                >
                  <Text style={styles.chapterChipText}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {book && chapter !== null && (
          <>
            <ScrollView contentContainerStyle={styles.content}>
              {loading && <ActivityIndicator color="#B9964E" style={{ marginTop: 40 }} />}
              {failed && (
                <Text style={styles.errorText}>
                  Couldn't load this chapter. Check your internet connection and
                  tap the chapter again.
                </Text>
              )}
              {verses && (
                <View style={styles.chapterHead}>
                  <Text style={styles.chapterHeadText}>
                    {book.name} {chapter}
                  </Text>
                  <View style={styles.chapterRule} />
                </View>
              )}
              {verses?.map((v) => (
                <Pressable key={v.verse} onPress={() => toggleVerse(v.verse)}>
                  <Text
                    style={[
                      styles.verseLine,
                      selected.has(v.verse) && styles.verseSelected,
                    ]}
                  >
                    <Text style={styles.verseNum}>{v.verse} </Text>
                    {v.text}
                  </Text>
                </Pressable>
              ))}
              {verses && (
                <Text style={styles.shareHint}>
                  Tap a verse to highlight it, then share it with someone.
                </Text>
              )}
            </ScrollView>
            {verses && selected.size > 0 && (
              <View style={styles.shareBar}>
                <Pressable style={styles.shareButton} onPress={shareSelected}>
                  <Medallion source={MEDALLIONS.dove} size={20} fallback="🕊️" />
                  <Text style={styles.shareButtonText}>
                    Share {selected.size}{' '}
                    {selected.size === 1 ? 'verse' : 'verses'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelected(new Set())}
                  hitSlop={10}
                >
                  <Text style={styles.shareCancel}>Clear</Text>
                </Pressable>
              </View>
            )}
            {verses && (
              <View style={styles.voiceRow}>
                <Text style={styles.voiceLabel}>Reading voice</Text>
                {voice.READER_VOICES.map((v) => (
                  <Pressable
                    key={v.key}
                    style={[
                      styles.voiceChip,
                      readerId === v.id && styles.voiceChipActive,
                    ]}
                    onPress={() => pickReaderVoice(v.id)}
                  >
                    <Text
                      style={[
                        styles.voiceChipText,
                        readerId === v.id && styles.voiceChipTextActive,
                      ]}
                    >
                      {v.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {verses && (
              <View style={styles.readBar}>
                <Pressable style={styles.navButton} onPress={() => goChapter(-1)}>
                  <Text style={styles.navButtonText}>‹ Prev</Text>
                </Pressable>
                <Pressable
                  style={[styles.readButton, reading && styles.readButtonActive]}
                  onPress={reading ? stopReading : readAloud}
                >
                  <Text style={styles.readButtonText}>
                    {reading ? '■ Stop' : '▶ Read to me'}
                  </Text>
                </Pressable>
                <Pressable style={styles.navButton} onPress={() => goChapter(1)}>
                  <Text style={styles.navButtonText}>Next ›</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

// A warm parchment palette — reading here should feel like the page
// of a well-loved Bible.
const PAPER = '#F4EBD8';
const CARD = '#FBF5E7';
const EDGE = '#D9C7A1';
const INK = '#3E3121';
const INK_SOFT = '#8A7A5C';
const GOLD = '#8B6B2E';
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif' });

// Old-leather bindings for the book spines, with gold-tooled titles.
const LEATHERS = [
  { bg: '#4A2E1E', edge: '#6B4428' }, // dark brown
  { bg: '#5C2B23', edge: '#7E3D32' }, // oxblood
  { bg: '#3E3A2A', edge: '#5A543C' }, // faded olive
  { bg: '#54391F', edge: '#76522E' }, // chestnut
  { bg: '#2F3140', edge: '#474A5E' }, // midnight
  { bg: '#46281F', edge: '#64392C' }, // mahogany
];
// How far each volume juts in or out of the stack.
const SPINE_INSETS = [6, 0, 10, 3, 12, 1, 8, 4];

// Each book keeps ITS leather everywhere — the spine on the shelf and
// the opened book on the chapter screen match.
const leatherFor = (name: string) =>
  LEATHERS[
    [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % LEATHERS.length
  ];

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
  headerButton: {
    color: GOLD,
    fontSize: 15,
  },
  headerTitle: {
    color: INK,
    fontSize: 19,
    fontWeight: '600',
    fontFamily: SERIF,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 14,
    fontFamily: SERIF,
    textAlign: 'center',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    shadowColor: '#8B6B2E',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  continueLabel: {
    color: 'rgba(251,245,231,0.7)',
    fontSize: 10,
    letterSpacing: 2,
  },
  continueText: {
    color: '#FBF5E7',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: SERIF,
    marginTop: 2,
  },
  continueArrow: {
    color: '#FBF5E7',
    fontSize: 26,
  },
  orderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  orderChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EDGE,
    backgroundColor: CARD,
  },
  orderChipActive: {
    backgroundColor: 'rgba(139,107,46,0.16)',
    borderColor: GOLD,
  },
  orderChipText: {
    color: INK_SOFT,
    fontSize: 14,
  },
  orderChipTextActive: {
    color: INK,
    fontWeight: '600',
  },
  timelineNote: {
    color: INK_SOFT,
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: SERIF,
    textAlign: 'center',
    marginTop: 14,
  },
  testamentTitle: {
    color: INK,
    fontSize: 22,
    fontWeight: '600',
    fontFamily: SERIF,
    textAlign: 'center',
    marginTop: 22,
  },
  testamentRule: {
    width: 46,
    height: 1,
    backgroundColor: GOLD,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  groupLabel: {
    color: GOLD,
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  stack: {
    paddingBottom: 6,
  },
  spine: {
    borderRadius: 7,
    borderWidth: 1,
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    shadowColor: '#2A1C0E',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  spineTooling: {
    height: 1,
    backgroundColor: 'rgba(233,217,166,0.3)',
    marginHorizontal: 2,
  },
  spineRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  spineName: {
    color: '#E9D9A6',
    fontSize: 16,
    fontFamily: SERIF,
    fontWeight: '600',
    letterSpacing: 1.6,
    textAlign: 'center',
    maxWidth: '82%',
  },
  spineChapters: {
    position: 'absolute',
    right: 4,
    color: 'rgba(233,217,166,0.5)',
    fontSize: 11,
  },
  chapterHead: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 6,
  },
  chapterHeadText: {
    color: INK,
    fontSize: 26,
    fontWeight: '600',
    fontFamily: SERIF,
  },
  chapterRule: {
    width: 52,
    height: 1,
    backgroundColor: GOLD,
    marginTop: 10,
  },
  openSpine: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#2A1C0E',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  openSpineTitle: {
    color: '#E9D9A6',
    fontSize: 20,
    fontFamily: SERIF,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    paddingVertical: 10,
  },
  chapterCount: {
    color: INK_SOFT,
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: SERIF,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  // Small parchment rounds with a thin gold ring — the same quiet
  // medallion language as the rest of the app.
  chapterChip: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#C9AE6E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B6B2E',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  chapterChipText: {
    color: INK,
    fontSize: 16,
    fontFamily: SERIF,
  },
  verseLine: {
    color: INK,
    fontSize: 18,
    lineHeight: 30,
    marginBottom: 10,
    fontFamily: SERIF,
  },
  verseSelected: {
    backgroundColor: 'rgba(185,150,78,0.28)',
    borderRadius: 6,
  },
  verseNum: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
  },
  shareHint: {
    color: INK_SOFT,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    fontStyle: 'italic',
    fontFamily: SERIF,
  },
  errorText: {
    color: INK_SOFT,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  translationNote: {
    color: INK_SOFT,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
  },
  shareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: EDGE,
  },
  shareButton: {
    flex: 1,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: CARD,
    fontSize: 15,
    fontWeight: '700',
  },
  shareCancel: {
    color: INK_SOFT,
    fontSize: 14,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: EDGE,
  },
  voiceLabel: {
    color: INK_SOFT,
    fontSize: 12,
    marginRight: 2,
  },
  voiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EDGE,
    backgroundColor: CARD,
  },
  voiceChipActive: {
    backgroundColor: 'rgba(139,107,46,0.18)',
    borderColor: GOLD,
  },
  voiceChipText: {
    color: INK_SOFT,
    fontSize: 13,
  },
  voiceChipTextActive: {
    color: INK,
    fontWeight: '600',
  },
  readBar: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EDGE,
    backgroundColor: CARD,
  },
  navButtonText: {
    color: INK,
    fontSize: 14,
  },
  readButton: {
    flex: 1,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  readButtonActive: {
    backgroundColor: 'rgba(160, 70, 50, 0.95)',
  },
  readButtonText: {
    color: CARD,
    fontSize: 15,
    fontWeight: '700',
  },
});
