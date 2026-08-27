import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import * as profile from './src/lib/profile';
import * as voice from './src/lib/voice';

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
  const [voiceReady, setVoiceReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [praying, setPraying] = useState(false);
  const [userName, setUserName] = useState('');
  const [voiceId, setVoiceId] = useState('');

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    loadStoredKey().then(setAiReady);
    voice.loadVoiceKey().then((ready) => {
      setVoiceReady(ready);
      setVoiceId(voice.getCustomVoiceId() ?? '');
    });
    profile.loadName().then((n) => setUserName(n ?? ''));
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
    setSpeaking(true);
    // During a prayer, he closes his eyes and bows his head.
    if (response.isPrayer) setPraying(true);
    voice.speak(spokenText(response), () => {
      setSpeaking(false);
      setPraying(false);
    });
  };

  const stopSpeaking = () => {
    voice.stop();
    setSpeaking(false);
    setPraying(false);
  };

  // Tap the mic, speak, tap again — your words become the message.
  const toggleMic = async () => {
    if (transcribing) return;
    if (!voiceReady) {
      Alert.alert(
        'Voice input needs ElevenLabs',
        'Add your ElevenLabs API key in settings (⚙️) to talk to him with your voice.'
      );
      return;
    }
    if (!recording) {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone needed', 'Allow microphone access to speak.');
        return;
      }
      voice.stop();
      setSpeaking(false);
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
      setListening(true);
    } else {
      setRecording(false);
      setTranscribing(true);
      try {
        await recorder.stop();
        // Restore the playback route so replies come out of the speaker.
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
        const uri = recorder.uri;
        const result = uri
          ? await voice.transcribe(uri)
          : { text: null as string | null };
        if (result.text) {
          await send(result.text);
        } else if (result.problem === 'permission') {
          Alert.alert(
            'Key needs Speech to Text',
            'Your ElevenLabs API key doesn’t allow Speech to Text. In ElevenLabs, create a key with both "Text to Speech" and "Speech to Text" enabled, then save it in ⚙️ settings.'
          );
        } else if (result.problem === 'network') {
          Alert.alert('No connection', 'Please check your internet and try again.');
        } else {
          Alert.alert(
            "I couldn't hear that",
            'Please try speaking again, a little closer to the phone.'
          );
        }
      } finally {
        setTranscribing(false);
        setListening(false);
      }
    }
  };

  const send = async (spokenQuestion?: string) => {
    const question = (spokenQuestion ?? input).trim();
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
          praying={praying}
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
                    {ex.response.verse && (
                      <>
                        <Text style={styles.verseText}>“{ex.response.verse.text}”</Text>
                        <Text style={styles.verseRef}>— {ex.response.verse.ref}</Text>
                      </>
                    )}
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
            <Pressable
              onPress={toggleMic}
              style={({ pressed }) => [
                styles.micButton,
                recording && styles.micRecording,
                pressed && styles.sendPressed,
              ]}
            >
              <Text style={styles.micText}>{recording ? '■' : '🎤'}</Text>
            </Pressable>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              onFocus={() => setListening(true)}
              onBlur={() => setListening(false)}
              onSubmitEditing={() => send()}
              placeholder={
                recording
                  ? 'Listening… tap ■ when done'
                  : transcribing
                    ? 'Understanding…'
                    : 'Speak what is on your heart…'
              }
              placeholderTextColor={recording ? '#C8A45C' : '#7A7A72'}
              returnKeyType="send"
              multiline={false}
              editable={!recording && !transcribing}
            />
            <Pressable
              onPress={() => send()}
              style={({ pressed }) => [styles.sendButton, pressed && styles.sendPressed]}
            >
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>

          <SettingsModal
            visible={settingsOpen}
            userName={userName}
            voiceId={voiceId}
            hasAiKey={aiReady}
            hasVoiceKey={voiceReady}
            onSaveName={(name) => {
              profile.setName(name).then(() => setUserName(profile.getName() ?? ''));
            }}
            onSaveVoiceId={(id) => {
              voice.setCustomVoiceId(id).then(() =>
                setVoiceId(voice.getCustomVoiceId() ?? '')
              );
            }}
            onSaveAiKey={saveKey}
            onClearAiKey={clearKey}
            onSaveVoiceKey={(key) => {
              voice.setVoiceKey(key).then(() => setVoiceReady(voice.hasVoiceKey()));
            }}
            onClearVoiceKey={() => {
              voice.setVoiceKey('').then(() => setVoiceReady(false));
            }}
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
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRecording: {
    backgroundColor: 'rgba(200, 80, 60, 0.85)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  micText: {
    fontSize: 17,
    color: '#F2F2EE',
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
