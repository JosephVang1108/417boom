import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
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
import * as voice from '../lib/voice';

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
  const readingRef = useRef(false);

  useEffect(() => {
    if (book && chapter) {
      setLoading(true);
      setFailed(false);
      setVerses(null);
      fetchChapter(book.name, chapter).then((v) => {
        setVerses(v);
        setFailed(!v);
        setLoading(false);
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
    if (!voice.hasVoiceKey()) {
      Alert.alert(
        'Voice needs ElevenLabs',
        'Add your ElevenLabs API key in ⚙️ settings to have chapters read aloud.'
      );
      return;
    }
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

    let upcoming = voice.synthesize(chunks[0]);
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
      if (i + 1 < chunks.length) upcoming = voice.synthesize(chunks[i + 1]);
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
                <Text key={v.verse} style={styles.verseLine}>
                  <Text style={styles.verseNum}>{v.verse} </Text>
                  {v.text}
                </Text>
              ))}
            </ScrollView>
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
  headerButton: {
    color: '#B9964E',
    fontSize: 15,
  },
  headerTitle: {
    color: '#F0E6CE',
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#C8A45C',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 12,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bookChipText: {
    color: '#E8E8E2',
    fontSize: 14,
  },
  chapterChip: {
    width: 52,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterChipText: {
    color: '#E8E8E2',
    fontSize: 15,
  },
  verseLine: {
    color: '#E4E4DC',
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 10,
  },
  verseNum: {
    color: '#B9964E',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#C9C9C2',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  translationNote: {
    color: '#6E6E66',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
  },
  readBar: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  navButtonText: {
    color: '#E8E8E2',
    fontSize: 14,
  },
  readButton: {
    flex: 1,
    backgroundColor: '#B9964E',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  readButtonActive: {
    backgroundColor: 'rgba(200, 80, 60, 0.9)',
  },
  readButtonText: {
    color: '#0A0A0A',
    fontSize: 15,
    fontWeight: '700',
  },
});
