import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import JesusFace, { JesusFaceHandle } from './src/components/JesusFace';
import { respond, spokenText, GuideResponse } from './src/lib/guide';

interface Exchange {
  id: number;
  question: string;
  response: GuideResponse;
}

const FACE_SIZE = Math.min(Dimensions.get('window').width * 0.72, 300);

export default function App() {
  const faceRef = useRef<JesusFaceHandle>(null);
  const faceBox = useRef({ w: FACE_SIZE, h: FACE_SIZE * 1.2 });
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(1);

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Exchange[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);

  // Dragging a finger over the face moves the gaze toward it.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => track(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
      onPanResponderMove: (evt) => track(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
    })
  ).current;

  const track = (x: number, y: number) => {
    const { w, h } = faceBox.current;
    faceRef.current?.lookToward((x - w / 2) / (w / 2), (y - h * 0.44) / (h / 2));
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

  const send = () => {
    const question = input.trim();
    if (!question) return;
    const response = respond(question);
    setHistory((h) => [...h, { id: nextId.current++, question, response }]);
    setInput('');
    if (voiceOn) speak(response);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const toggleVoice = () => {
    if (voiceOn) stopSpeaking();
    setVoiceOn((v) => !v);
  };

  const latest = history[history.length - 1];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Abide</Text>
          <Pressable onPress={toggleVoice} hitSlop={12}>
            <Text style={styles.voiceToggle}>{voiceOn ? '🔊 Voice on' : '🔇 Voice off'}</Text>
          </Pressable>
        </View>

        <View style={styles.faceArea}>
          <View
            style={{ width: FACE_SIZE, height: FACE_SIZE * 1.2 }}
            onLayout={(e) =>
              (faceBox.current = {
                w: e.nativeEvent.layout.width,
                h: e.nativeEvent.layout.height,
              })
            }
            {...pan.panHandlers}
          >
            <JesusFace
              ref={faceRef}
              size={FACE_SIZE}
              speaking={speaking}
              listening={listening}
            />
          </View>
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
            placeholderTextColor="#8B93A8"
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#141B2E',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  title: {
    color: '#F0E6CE',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 3,
  },
  voiceToggle: {
    color: '#B8C0D4',
    fontSize: 13,
  },
  faceArea: {
    alignItems: 'center',
    paddingTop: 4,
  },
  stopButton: {
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#232D47',
  },
  stopButtonText: {
    color: '#C9D2E8',
    fontSize: 12,
  },
  conversation: {
    flex: 1,
    marginTop: 6,
  },
  conversationContent: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  hint: {
    color: '#8B93A8',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  exchange: {
    marginBottom: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2C3A5C',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: '85%',
    marginBottom: 8,
  },
  userText: {
    color: '#E8ECF6',
    fontSize: 15,
  },
  replyCard: {
    alignSelf: 'flex-start',
    backgroundColor: '#1D2740',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    maxWidth: '92%',
    borderWidth: 1,
    borderColor: '#2A3552',
  },
  replyCardLatest: {
    borderColor: '#B9964E',
  },
  replyIntro: {
    color: '#DDE3F0',
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
    color: '#B9964E',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    gap: 10,
    backgroundColor: '#10162A',
  },
  input: {
    flex: 1,
    backgroundColor: '#1D2740',
    color: '#EDF0F8',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#B9964E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPressed: {
    opacity: 0.7,
  },
  sendText: {
    color: '#10162A',
    fontSize: 18,
    fontWeight: '700',
  },
});
