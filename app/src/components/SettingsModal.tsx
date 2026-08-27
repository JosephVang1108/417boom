import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  hasKey: boolean;
  onSave: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function SettingsModal({ visible, hasKey, onSave, onClear, onClose }: Props) {
  const [draft, setDraft] = useState('');

  const save = () => {
    if (draft.trim()) {
      onSave(draft.trim());
      setDraft('');
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>AI Conversations</Text>
          <Text style={styles.body}>
            With an Anthropic API key, responses are powered by Claude and truly
            understand what you share. Without one, the app uses its built-in
            verse library.
          </Text>
          <Text style={styles.status}>
            {hasKey ? '✓ AI is active' : 'No API key set — offline mode'}
          </Text>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="sk-ant-…"
            placeholderTextColor="#8B93A8"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Text style={styles.note}>
            The key is stored securely on this device only.
          </Text>
          <View style={styles.row}>
            {hasKey && (
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={() => { onClear(); onClose(); }}>
                <Text style={styles.buttonGhostText}>Remove key</Text>
              </Pressable>
            )}
            <Pressable style={[styles.button, styles.buttonGhost]} onPress={onClose}>
              <Text style={styles.buttonGhostText}>Close</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={save}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 20, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1D2740',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3552',
  },
  title: {
    color: '#F0E6CE',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  body: {
    color: '#C9D2E8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  status: {
    color: '#B9964E',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#141B2E',
    color: '#EDF0F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A3552',
  },
  note: {
    color: '#8B93A8',
    fontSize: 12,
    marginTop: 8,
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
    color: '#10162A',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A3552',
  },
  buttonGhostText: {
    color: '#C9D2E8',
    fontSize: 14,
  },
});
