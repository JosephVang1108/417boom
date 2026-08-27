import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { JesusFaceHandle } from './src/components/JesusFace';
import JesusPortrait from './src/components/JesusPortrait';
import SettingsModal from './src/components/SettingsModal';
import {
  aiRespond,
  hasApiKey,
  loadStoredKey,
  resetConversation,
  setApiKey,
} from './src/lib/ai';
import { respond, spokenText, GuideResponse } from './src/lib/guide';

interface Exchange {
  id: number;
  question: string;
  response: GuideResponse | null; // null while waiting for the answer
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function App() {
  const faceRef = useRef<JesusFaceHandle>(null);
  const touchZone = useRef({ w: SCREEN_W, h: SCREEN_H * 0.5 });
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(1);

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Exchange[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [aiReady, setAiReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadStoredKey().then(setAiReady);
  }, []);

  // Dragging a finger over the face leans him toward it.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => track(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
      onPanResponderMove: (evt) => track(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
    })
  ).current;

  const track = (x: number, y: number) => {
    const { w, h } = touchZone.current;
    faceRef.current?.lookToward((x - w / 2) / (w / 2), (y - h / 2) / (h / 2));
  };

  const speak = (response: GuideResponse) => {
    Speech.stop();
    setSpeaking(true);
    Speech.speak(spokenText(response), {
      rate: 0.92,
      pitch: 0.9,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setSpeaking(false);
  };

  const send = async () => {
    const question = input.trim();
    if (!question) return;
    const id = nextId.current++;
    setHistory((h) => [...h, { id, question, response: null }]);
    setInput('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    // Prefer Claude when a key is set; fall back to the offline verse engine.
    let response: GuideResponse | null = null;
    if (aiReady) {
      response = await aiRespond(question);
      if (!hasApiKey()) setAiReady(false); // key was rejected
    }
    if (!response) response = respond(question);

    setHistory((h) => h.map((ex) => (ex.id === id ? { ...ex, response } : ex)));
    if (voiceOn) speak(response);
  };

  const saveKey = async (key: string) => {
    await setApiKey(key);
    resetConversation();
    setAiReady(hasApiKey());
  };

  const clearKey = async () => {
    await setApiKey('');
    resetConversation();
    setAiReady(false);
  };

  const toggleVoice = () => {
    if (voiceOn) stopSpeaking();
    setVoiceOn((v) => !v);
  };

  const latest = history[history.length - 1];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Full-screen portrait behind everything */}
      <View style={StyleSheet.absoluteFill}>
        <JesusPortrait
          ref={faceRef}
          width={SCREEN_W}
          height={SCREEN_H}
          speaking={speaking}
          listening={listening}
        />
      </View>

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>ABIDE</Text>
              {aiReady && <Text style={styles.aiBadge}>AI</Text>}
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={toggleVoice} hitSlop={12}>
                <Text style={styles.voiceToggle}>{voiceOn ? '🔊' : '🔇'}</Text>
              </Pressable>
              <Pressable onPress={() => setSettingsOpen(true)} hitSlop={12}>
                <Text style={styles.voiceToggle}>⚙️</Text>
              </Pressable>
            </View>
          </View>

          {/* The face itself — touch to have him lean toward you */}
          <View
            style={styles.faceTouchZone}
            onLayout={(e) =>
              (touchZone.current = {
                w: e.nativeEvent.layout.width,
                h: e.nativeEvent.layout.height,
              })
            }
            {...pan.panHandlers}
          >
            {speaking && (
              <Pressable onPress={stopSpeaking} style={styles.stopButton}>
                <Text style={styles.stopButtonText}>Tap to pause</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.conversation}
            contentContainerStyle={styles.conversationContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {history.length === 0 && (
              <Text style={styles.hint}>
                Share what is on your heart — a worry, a joy, a question. I will
                listen and answer with words of scripture.
              </Text>
            )}
            {history.map((ex) => (
              <View key={ex.id} style={styles.exchange}>
                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{ex.question}</Text>
                </View>
                {ex.response ? (
                  <View
                    style={[
                      styles.replyCard,
                      latest?.id === ex.id && styles.replyCardLatest,
                    ]}
                  >
                    <Text style={styles.replyIntro}>{ex.response.intro}</Text>
                    <Text style={styles.verseText}>“{ex.response.verse.text}”</Text>
                    <Text style={styles.verseRef}>— {ex.response.verse.ref}</Text>
                  </View>
                ) : (
                  <View style={styles.replyCard}>
                    <Text style={styles.replyIntro}>…</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              onFocus={() => setListening(true)}
              onBlur={() => setListening(false)}
              onSubmitEditing={send}
              placeholder="Speak what is on your heart…"
              placeholderTextColor="#7A7A72"
              returnKeyType="send"
              multiline={false}
            />
            <Pressable
              onPress={send}
              style={({ pressed }) => [styles.sendButton, pressed && styles.sendPressed]}
            >
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>

          <SettingsModal
            visible={settingsOpen}
            hasKey={aiReady}
            onSave={saveKey}
            onClear={clearKey}
            onClose={() => setSettingsOpen(false)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  title: {
    color: 'rgba(240, 230, 206, 0.9)',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiBadge: {
    color: '#0A0A0A',
    backgroundColor: 'rgba(185, 150, 78, 0.9)',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  voiceToggle: {
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  faceTouchZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  stopButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(185, 150, 78, 0.4)',
  },
  stopButtonText: {
    color: 'rgba(240, 230, 206, 0.9)',
    fontSize: 12,
  },
  conversation: {
    maxHeight: SCREEN_H * 0.34,
    flexGrow: 0,
  },
  conversationContent: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  hint: {
    color: 'rgba(230, 230, 220, 0.75)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 28,
    paddingBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 8,
  },
  exchange: {
    marginBottom: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: '85%',
    marginBottom: 8,
  },
  userText: {
    color: 'rgba(240, 240, 235, 0.95)',
    fontSize: 15,
  },
  replyCard: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(8, 8, 8, 0.72)',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    maxWidth: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  replyCardLatest: {
    borderColor: 'rgba(185, 150, 78, 0.75)',
  },
  replyIntro: {
    color: 'rgba(235, 235, 230, 0.95)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  verseText: {
    color: '#F0DFAE',
    fontSize: 15,
    lineHeight: 23,
    fontStyle: 'italic',
  },
  verseRef: {
    color: '#C8A45C',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 6 : 12,
    gap: 10,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#F2F2EE',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(185, 150, 78, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPressed: {
    opacity: 0.7,
  },
  sendText: {
    color: '#0A0A0A',
    fontSize: 18,
    fontWeight: '700',
  },
});
