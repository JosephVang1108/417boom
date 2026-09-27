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

export default function BibleScreen({ visible, onClose }: Props) {
  const [book, setBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<BibleVerse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reading, setReading] = useState(false);
  const [readerId, setReaderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const readingRef = useRef(false);

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
        message: `“${text}” — ${ref}\n\nShared from Abide 🙏`,
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

  const bookList = (title: string, books: BibleBook[]) => (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {books.map((b) => (
          <Pressable key={b.name} style={styles.bookChip} onPress={() => setBook(b)}>
            <Text style={styles.bookChipText}>{b.name}</Text>
          </Pressable>
        ))}
      </View>
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
            {bookList('New Testament', NEW_TESTAMENT)}
            {bookList('Old Testament', OLD_TESTAMENT)}
            <Text style={styles.translationNote}>World English Bible (public domain)</Text>
          </ScrollView>
        )}

        {book && chapter === null && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Choose a chapter</Text>
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
                  <Medallion uri={MEDALLIONS.dove} size={20} fallback="🕊️" />
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
    marginBottom: 12,
    fontFamily: SERIF,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: EDGE,
  },
  bookChipText: {
    color: INK,
    fontSize: 14,
  },
  chapterChip: {
    width: 52,
    height: 44,
    borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: EDGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterChipText: {
    color: INK,
    fontSize: 15,
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
