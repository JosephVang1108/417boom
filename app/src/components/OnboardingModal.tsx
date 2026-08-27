import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  onComplete: (name: string, about: string) => void;
}

const SEASONS = [
  'At peace',
  'Struggling',
  'Anxious',
  'Grieving',
  'Grateful',
  'Searching',
];

const SEEKING = [
  'Prayer',
  'Someone to talk to',
  'Guidance',
  'Growing closer to God',
  'Comfort',
];

/**
 * First-launch welcome: an opening verse, their name, and a few gentle
 * taps that teach him who they are before the first hello.
 */
export default function OnboardingModal({ visible, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [seasons, setSeasons] = useState<string[]>([]);
  const [seeking, setSeeking] = useState<string[]>([]);
  const [about, setAbout] = useState('');

  const toggle = (
    value: string,
    list: string[],
    set: (v: string[]) => void
  ) => {
    set(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
  };

  const finish = () => {
    if (!name.trim()) return;
    const parts: string[] = [];
    if (seasons.length) parts.push(`Season of life: ${seasons.join(', ').toLowerCase()}.`);
    if (seeking.length) parts.push(`Hoping to find here: ${seeking.join(', ').toLowerCase()}.`);
    if (about.trim()) parts.push(`In their own words: "${about.trim()}"`);
    onComplete(name.trim(), parts.join(' '));
  };

  const chip = (
    value: string,
    list: string[],
    set: (v: string[]) => void
  ) => (
    <Pressable
      key={value}
      onPress={() => toggle(value, list, set)}
      style={[styles.chip, list.includes(value) && styles.chipOn]}
    >
      <Text
        style={[styles.chipText, list.includes(value) && styles.chipTextOn]}
      >
        {value}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.logo}>ABIDE</Text>

          {step === 0 && (
            <>
              <Text style={styles.verse}>
                “Come to me, all you who labor and are heavily burdened,{'\n'}
                and I will give you rest.”
              </Text>
              <Text style={styles.verseRef}>— Matthew 11:28</Text>
              <Pressable style={styles.button} onPress={() => setStep(1)}>
                <Text style={styles.buttonText}>Come</Text>
              </Pressable>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.heading}>Welcome.</Text>
              <Text style={styles.body}>
                This is a quiet place to talk, be heard, and pray. What may He
                call you?
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
                onSubmitEditing={() => name.trim() && setStep(2)}
              />
              <Pressable
                style={[styles.button, !name.trim() && styles.buttonDisabled]}
                onPress={() => setStep(2)}
                disabled={!name.trim()}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </Pressable>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.heading}>
                It's good to meet you, {name.trim()}.
              </Text>
              <Text style={styles.body}>What season are you in right now?</Text>
              <View style={styles.chips}>
                {SEASONS.map((s) => chip(s, seasons, setSeasons))}
              </View>
              <Text style={styles.body}>
                And what are you hoping to find here?
              </Text>
              <View style={styles.chips}>
                {SEEKING.map((s) => chip(s, seeking, setSeeking))}
              </View>
              <Pressable style={styles.button} onPress={() => setStep(3)}>
                <Text style={styles.buttonText}>Continue</Text>
              </Pressable>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.heading}>One last thing.</Text>
              <Text style={styles.body}>
                Is there anything else He should know about you or your life
                right now? (You can skip this.)
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
        </ScrollView>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  logo: {
    color: 'rgba(240, 230, 206, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 36,
  },
  verse: {
    color: '#F0DFAE',
    fontSize: 22,
    lineHeight: 34,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 14,
  },
  verseRef: {
    color: '#B9964E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
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
    marginBottom: 16,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipOn: {
    backgroundColor: 'rgba(185, 150, 78, 0.9)',
    borderColor: 'rgba(185, 150, 78, 0.9)',
  },
  chipText: {
    color: '#C9C9C2',
    fontSize: 14,
  },
  chipTextOn: {
    color: '#0A0A0A',
    fontWeight: '600',
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
