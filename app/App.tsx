import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
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
import BibleScreen from './src/components/BibleScreen';
import JesusPortrait from './src/components/JesusPortrait';
import OnboardingModal from './src/components/OnboardingModal';
import SettingsModal from './src/components/SettingsModal';
import {
  aiRespond,
  hasApiKey,
  isAiAvailable,
  loadStoredKey,
  resetConversation,
  setApiKey,
} from './src/lib/ai';
import { backendConfigured } from './src/lib/config';
import * as dailyVerse from './src/lib/dailyVerse';
import * as journal from './src/lib/journal';
import { touchStreak } from './src/lib/streak';
import {
  displayText,
  encouragement,
  respond,
  spokenText,
  GuideResponse,
} from './src/lib/guide';
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
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [bibleOpen, setBibleOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [verseEnabled, setVerseEnabled] = useState(false);

  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true, // powers the go-quiet auto-stop
  });
  const recorderState = useAudioRecorderState(recorder, 150);

  // Conversational mic: press to open, speak freely, and it sends by
  // itself after ~2s of quiet (or tap again to send immediately).
  const heardSpeech = useRef(false);
  const lastLoudAt = useRef(0);
  const micOpenedAt = useRef(0);

  // ---- Idle encouragement: after a quiet stretch with the app open,
  // he says something kind, unprompted. Grows less frequent over time.
  const lastActivity = useRef(Date.now());
  const idleWait = useRef(120_000 + Math.random() * 60_000);
  const idleState = useRef({ blocked: true, voiceOn: true });
  idleState.current = {
    blocked:
      speaking ||
      recording ||
      transcribing ||
      settingsOpen ||
      bibleOpen ||
      onboardingVisible ||
      history.length === 0,
    voiceOn,
  };
  const markActive = () => {
    lastActivity.current = Date.now();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const { blocked, voiceOn: speakIt } = idleState.current;
      if (blocked) return;
      if (Date.now() - lastActivity.current < idleWait.current) return;
      const gentle: GuideResponse = {
        topicId: 'idle',
        intro: encouragement(),
        verse: null,
      };
      setHistory((h) => [...h, { id: nextId.current++, question: '', response: gentle }]);
      if (speakIt) speak(gentle);
      markActive();
      // Back off so it stays precious: 2min -> ~3.5min -> ~6min -> 10min cap.
      idleWait.current = Math.min(idleWait.current * 1.7, 600_000);
    }, 15_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadStoredKey().then(() => setAiReady(isAiAvailable()));
    voice.loadVoiceKey().then(() => {
      setVoiceReady(voice.voiceAvailable());
      setVoiceId(voice.getCustomVoiceId() ?? '');
    });
    profile.loadProfile().then(({ name, onboarded }) => {
      setUserName(name ?? '');
      if (!onboarded) setOnboardingVisible(true);
    });
    touchStreak().then(setStreak);
    journal.loadJournal();
    dailyVerse.isDailyVerseEnabled().then((on) => {
      setVerseEnabled(on);
      if (on) dailyVerse.refreshSchedule();
    });
  }, []);

  const completeOnboarding = async (name: string, about: string) => {
    await profile.setName(name);
    if (about) await profile.setAbout(about);
    await profile.markOnboarded();
    setUserName(name);
    setOnboardingVisible(false);
    // He greets them by name the moment they arrive.
    const greeting: GuideResponse = {
      topicId: 'welcome',
      intro: `Welcome, ${name}. … I'm so glad you're here. Whenever you're ready — tell me what's on your heart.`,
      verse: null,
    };
    setHistory([{ id: nextId.current++, question: '', response: greeting }]);
    if (voiceOn) speak(greeting);
  };

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
    markActive();
    const { w, h } = touchZone.current;
    faceRef.current?.lookToward((x - w / 2) / (w / 2), (y - h / 2) / (h / 2));
  };

  const speak = (response: GuideResponse) => {
    setSpeaking(true);
    // During a prayer, he closes his eyes and bows his head.
    if (response.isPrayer) setPraying(true);
    voice.speak(
      spokenText(response),
      () => {
        setSpeaking(false);
        setPraying(false);
      },
      { story: response.isStory }
    );
  };

  const stopSpeaking = () => {
    voice.stop();
    setSpeaking(false);
    setPraying(false);
  };

  // Press the mic to open it; it stays listening after you let go.
  const startTalking = async () => {
    markActive();
    if (recording || transcribing) return;
    if (!voiceReady) {
      Alert.alert(
        'Voice not connected',
        'Voice input isn’t available right now. Check your connection, or add an ElevenLabs key in ⚙️ settings.'
      );
      return;
    }
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone needed', 'Allow microphone access to speak.');
      return;
    }
    voice.stop();
    setSpeaking(false);
    heardSpeech.current = false;
    lastLoudAt.current = 0;
    micOpenedAt.current = Date.now();
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
    setListening(true);
  };

  // Watch the mic level: once they've spoken, ~2s of quiet sends the
  // message; if they never speak, the mic closes itself after 10s.
  useEffect(() => {
    if (!recording) return;
    const level = recorderState.metering;
    if (typeof level !== 'number') return; // metering unavailable — manual stop
    const now = Date.now();
    if (level > -38) {
      heardSpeech.current = true;
      lastLoudAt.current = now;
    } else if (heardSpeech.current && now - lastLoudAt.current > 2000) {
      stopTalking();
    } else if (!heardSpeech.current && now - micOpenedAt.current > 10_000) {
      stopTalking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState.metering, recording]);

  const stopTalking = async () => {
    if (!recording) return;
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
      } else if (result.problem === 'network') {
        Alert.alert('No connection', 'Please check your internet and try again.');
      } else if (heardSpeech.current) {
        Alert.alert(
          "I couldn't hear that",
          'Please try again, a little closer to the phone.'
        );
      }
      // Mic closed without speech — no alert, they just changed their mind.
    } finally {
      setTranscribing(false);
      setListening(false);
    }
  };

  const send = async (spokenQuestion?: string) => {
    markActive();
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
      if (!isAiAvailable()) setAiReady(false); // key was rejected
    }
    if (!response) response = respond(question);

    setHistory((h) => h.map((ex) => (ex.id === id ? { ...ex, response } : ex)));
    if (response.isPrayer) journal.addPrayer(question);
    if (voiceOn) speak(response);
  };

  const saveKey = async (key: string) => {
    await setApiKey(key);
    resetConversation();
    setAiReady(isAiAvailable());
  };

  const clearKey = async () => {
    await setApiKey('');
    resetConversation();
    setAiReady(isAiAvailable());
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
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>ABIDE</Text>
                {aiReady && <Text style={styles.aiBadge}>AI</Text>}
              </View>
              {streak > 1 && (
                <Text style={styles.streakText}>Day {streak} together</Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  markActive();
                  setBibleOpen(true);
                }}
                hitSlop={12}
              >
                <Text style={styles.voiceToggle}>📖</Text>
              </Pressable>
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
                {!!ex.question && (
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{ex.question}</Text>
                  </View>
                )}
                {ex.response ? (
                  <View
                    style={[
                      styles.replyCard,
                      latest?.id === ex.id && styles.replyCardLatest,
                    ]}
                  >
                    <Text style={styles.replyIntro}>{displayText(ex.response.intro)}</Text>
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
              onPressIn={() => {
                if (recording) stopTalking();
                else startTalking();
              }}
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
                  ? 'Listening… just talk, pause when done'
                  : transcribing
                    ? 'Understanding…'
                    : 'Tap 🎤 and talk, or type…'
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
              voice.setVoiceKey('').then(() => setVoiceReady(voice.voiceAvailable()));
            }}
            backendMode={backendConfigured()}
            verseEnabled={verseEnabled}
            journal={journal.getJournal()}
            onToggleVerse={(enabled) => {
              dailyVerse.setDailyVerseEnabled(enabled).then((ok) => {
                setVerseEnabled(enabled && ok);
                if (enabled && !ok) {
                  Alert.alert(
                    'Notifications needed',
                    'Allow notifications in your phone settings to receive the daily verse.'
                  );
                }
              });
            }}
            onReplayWelcome={() => {
              setSettingsOpen(false);
              setOnboardingVisible(true);
            }}
            onClose={() => setSettingsOpen(false)}
          />

          <OnboardingModal
            visible={onboardingVisible}
            onComplete={completeOnboarding}
          />

          <BibleScreen
            visible={bibleOpen}
            onClose={() => {
              markActive();
              setBibleOpen(false);
            }}
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
  streakText: {
    color: 'rgba(200, 164, 92, 0.85)',
    fontSize: 11,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
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
