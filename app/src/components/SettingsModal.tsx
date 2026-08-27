import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  userName: string;
  voiceId: string;
  hasAiKey: boolean;
  hasVoiceKey: boolean;
  backendMode: boolean;
  onSaveName: (name: string) => void;
  onSaveVoiceId: (id: string) => void;
  onSaveAiKey: (key: string) => void;
  onClearAiKey: () => void;
  onSaveVoiceKey: (key: string) => void;
  onClearVoiceKey: () => void;
  onReplayWelcome: () => void;
  onClose: () => void;
}

export default function SettingsModal({
  visible,
  userName,
  voiceId,
  hasAiKey,
  hasVoiceKey,
  backendMode,
  onSaveName,
  onSaveVoiceId,
  onSaveAiKey,
  onClearAiKey,
  onSaveVoiceKey,
  onClearVoiceKey,
  onReplayWelcome,
  onClose,
}: Props) {
  const [aiDraft, setAiDraft] = useState('');
  const [voiceDraft, setVoiceDraft] = useState('');
  const [nameDraft, setNameDraft] = useState(userName);
  const [voiceIdDraft, setVoiceIdDraft] = useState(voiceId);

  useEffect(() => {
    if (visible) {
      setNameDraft(userName);
      setVoiceIdDraft(voiceId);
    }
  }, [visible, userName, voiceId]);

  const save = () => {
    if (nameDraft.trim() !== userName) {
      onSaveName(nameDraft.trim());
    }
    if (voiceIdDraft.trim() !== voiceId) {
      onSaveVoiceId(voiceIdDraft.trim());
    }
    if (aiDraft.trim()) {
      onSaveAiKey(aiDraft.trim());
      setAiDraft('');
    }
    if (voiceDraft.trim()) {
      onSaveVoiceKey(voiceDraft.trim());
      setVoiceDraft('');
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView>
            <Text style={styles.title}>Settings</Text>

            <Text style={styles.section}>Your name</Text>
            <Text style={styles.body}>
              So he can speak to you, and pray for you, by name.
            </Text>
            <TextInput
              style={styles.input}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your first name…"
              placeholderTextColor="#6E6E66"
              autoCapitalize="words"
              autoCorrect={false}
            />

            {backendMode && (
              <>
                <Text style={styles.section}>Abide service</Text>
                <Text style={styles.status}>
                  ✓ Connected — conversations and voice are ready
                </Text>
              </>
            )}

            {!backendMode && (
              <>
            <Text style={styles.section}>AI Conversations — Claude</Text>
            <Text style={styles.body}>
              With an Anthropic API key, responses truly understand what you
              share. Without one, the built-in verse library answers.
            </Text>
            <Text style={styles.status}>
              {hasAiKey ? '✓ AI is active' : 'Not set — offline verses'}
            </Text>
            <TextInput
              style={styles.input}
              value={aiDraft}
              onChangeText={setAiDraft}
              placeholder="sk-ant-…"
              placeholderTextColor="#6E6E66"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            {hasAiKey && (
              <Pressable onPress={onClearAiKey}>
                <Text style={styles.removeLink}>Remove Claude key</Text>
              </Pressable>
            )}

            <Text style={styles.section}>Voice — ElevenLabs</Text>
            <Text style={styles.body}>
              With an ElevenLabs API key, he speaks in a warm, natural,
              soothing voice. Without one, the phone's built-in voice is used.
            </Text>
            <Text style={styles.status}>
              {hasVoiceKey ? '✓ Natural voice active' : 'Not set — device voice'}
            </Text>
            <TextInput
              style={styles.input}
              value={voiceDraft}
              onChangeText={setVoiceDraft}
              placeholder="ElevenLabs API key…"
              placeholderTextColor="#6E6E66"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            {hasVoiceKey && (
              <Pressable onPress={onClearVoiceKey}>
                <Text style={styles.removeLink}>Remove voice key</Text>
              </Pressable>
            )}
              </>
            )}

            <Text style={styles.section}>Custom voice (optional)</Text>
            <Text style={styles.body}>
              Paste the Voice ID of a voice from your ElevenLabs account —
              for example one you created with Voice Design — and he will
              speak with it.
            </Text>
            <TextInput
              style={styles.input}
              value={voiceIdDraft}
              onChangeText={setVoiceIdDraft}
              placeholder="Voice ID…"
              placeholderTextColor="#6E6E66"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.section}>Custom voice (optional)</Text>
            <Text style={styles.body}>
              Design a voice in ElevenLabs (Voices → Voice Design), then paste
              its Voice ID here to use it. Leave empty for the default voice.
            </Text>
            <TextInput
              style={styles.input}
              value={voiceIdDraft}
              onChangeText={setVoiceIdDraft}
              placeholder="Voice ID, e.g. pNInz6obpgDQ…"
              placeholderTextColor="#6E6E66"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.note}>
              Keys are stored securely on this device only.
            </Text>
            <Pressable onPress={onReplayWelcome}>
              <Text style={styles.removeLink}>Replay the welcome</Text>
            </Pressable>
            <View style={styles.row}>
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={onClose}>
                <Text style={styles.buttonGhostText}>Close</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={save}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    maxHeight: '85%',
  },
  title: {
    color: '#F0E6CE',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  section: {
    color: '#C8A45C',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  body: {
    color: '#C9C9C2',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  status: {
    color: '#C8A45C',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0A0A0A',
    color: '#EDEDE8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  removeLink: {
    color: '#9A9A92',
    fontSize: 12,
    marginTop: 6,
    textDecorationLine: 'underline',
  },
  note: {
    color: '#7A7A72',
    fontSize: 12,
    marginTop: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    backgroundColor: '#B9964E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  buttonText: {
    color: '#0A0A0A',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonGhostText: {
    color: '#C9C9C2',
    fontSize: 14,
  },
});
