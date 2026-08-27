import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  onComplete: (name: string, about: string) => void;
}

/** First-launch welcome: learn their name (and, optionally, their heart). */
export default function OnboardingModal({ visible, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');

  const next = () => {
    if (step === 0 && name.trim()) setStep(1);
  };

  const finish = () => {
    if (!name.trim()) return;
    onComplete(name.trim(), about.trim());
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <Text style={styles.logo}>ABIDE</Text>

          {step === 0 ? (
            <>
              <Text style={styles.heading}>Welcome.</Text>
              <Text style={styles.body}>
                This is a quiet place to talk, be heard, and pray. Before you
                begin — what may He call you?
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your first name"
                placeholderTextColor="#6E6E66"
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={next}
              />
              <Pressable
                style={[styles.button, !name.trim() && styles.buttonDisabled]}
                onPress={next}
                disabled={!name.trim()}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.heading}>
                It's good to meet you, {name.trim()}.
              </Text>
              <Text style={styles.body}>
                Is there anything He should know about you or your season of
                life right now? (You can skip this.)
              </Text>
              <TextInput
                style={[styles.input, styles.inputTall]}
                value={about}
                onChangeText={setAbout}
                placeholder="I'm a father of two, work has been heavy lately…"
                placeholderTextColor="#6E6E66"
                multiline
              />
              <Pressable style={styles.button} onPress={finish}>
                <Text style={styles.buttonText}>Begin</Text>
              </Pressable>
              <Pressable onPress={finish}>
                <Text style={styles.skip}>Skip</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    color: 'rgba(240, 230, 206, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 36,
  },
  heading: {
    color: '#F0E6CE',
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 12,
  },
  body: {
    color: '#C9C9C2',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#F2F2EE',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 20,
  },
  inputTall: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#B9964E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
  skip: {
    color: '#8A8A82',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
});
