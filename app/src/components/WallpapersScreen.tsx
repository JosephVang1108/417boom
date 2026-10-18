import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { PREMIUM_UNLOCKED } from '../lib/config';
import {
  Wallpaper,
  WALLPAPERS,
  wallpaperThumbUrl,
  wallpaperUrl,
} from '../lib/wallpapers';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Verse wallpapers — browse, preview full screen, save to Photos.
 * Apple lets no app set the wallpaper itself, so the honest ceiling is
 * save-to-Photos plus a two-step "set it" note, same as every
 * wallpaper app on the store.
 */
export default function WallpapersScreen({ visible, onClose }: Props) {
  const [preview, setPreview] = useState<Wallpaper | null>(null);
  const [saving, setSaving] = useState(false);
  const { width } = useWindowDimensions();
  // Two columns with the screen's 16px gutters and a 12px gap.
  const tileW = (width - 16 * 2 - 12) / 2;
  const tileH = Math.round(tileW * (16 / 9));

  const open = (w: Wallpaper) => {
    if (!w.free && !PREMIUM_UNLOCKED) {
      Alert.alert(
        'This wallpaper is waiting for you',
        'The full wallpaper collection lives in Jireh Premium. The Lamb and Be Still are yours anytime, free.'
      );
      return;
    }
    setPreview(w);
  };

  const save = async (w: Wallpaper) => {
    if (saving) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert(
          'Jireh needs permission',
          'To save the wallpaper, allow adding photos in Settings → Jireh → Photos.'
        );
        return;
      }
      const dest = `${FileSystem.cacheDirectory}wallpaper-${w.id}.png`;
      const dl = await FileSystem.downloadAsync(wallpaperUrl(w), dest);
      await MediaLibrary.saveToLibraryAsync(dl.uri);
      Alert.alert(
        'Saved to your Photos ✓',
        'Now make it yours:\n\n1. Press and hold your lock screen\n2. Tap Customize (or +)\n3. Choose Photos and pick it'
      );
    } catch {
      Alert.alert(
        'That didn’t save',
        'Check your connection and try again in a moment.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallpapers</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          His word on your lock screen — the verse you see first and last
          every day.
        </Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {WALLPAPERS.map((w) => {
            const unlocked = w.free || PREMIUM_UNLOCKED;
            return (
              <Pressable
                key={w.id}
                style={[styles.tile, { width: tileW, height: tileH }]}
                onPress={() => open(w)}
              >
                <Image
                  source={{ uri: wallpaperThumbUrl(w) }}
                  style={styles.tileImage}
                  resizeMode="cover"
                />
                <View style={styles.tileFooter}>
                  <Text style={styles.tileTitle} numberOfLines={1}>
                    {w.title}
                  </Text>
                  <Text
                    style={[styles.tileTag, unlocked && styles.tileTagFree]}
                  >
                    {w.free ? 'FREE' : unlocked ? 'PREMIUM ✦' : '🔒 PREMIUM'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Full-screen preview with a mock clock so it reads as the
            future lock screen, not just a picture. */}
        <Modal
          visible={!!preview}
          animationType="fade"
          transparent={false}
          onRequestClose={() => setPreview(null)}
        >
          {preview && (
            <View style={styles.previewRoot}>
              <Image
                source={{ uri: wallpaperUrl(preview) }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View style={styles.mockClockWrap} pointerEvents="none">
                <Text style={styles.mockDate}>Sunday, December 6</Text>
                <Text style={styles.mockClock}>9:41</Text>
              </View>
              <Pressable
                style={styles.previewClose}
                hitSlop={12}
                onPress={() => setPreview(null)}
              >
                <Text style={styles.close}>✕</Text>
              </Pressable>
              <View style={styles.previewActions}>
                <Pressable
                  style={styles.saveButton}
                  onPress={() => save(preview)}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#1a1410" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save to Photos</Text>
                  )}
                </Pressable>
                <Text style={styles.previewHint}>
                  {preview.verse} — {preview.reference}
                </Text>
              </View>
            </View>
          )}
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#14100b',
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: {
    color: 'rgba(240, 230, 206, 0.95)',
    fontSize: 24,
    fontWeight: '700',
  },
  close: {
    color: 'rgba(240, 230, 206, 0.8)',
    fontSize: 22,
    padding: 4,
  },
  subtitle: {
    color: 'rgba(240, 230, 206, 0.55)',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  tile: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#201a12',
  },
  tileImage: {
    ...(StyleSheet.absoluteFill as object),
  },
  tileFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    backgroundColor: 'rgba(10, 8, 5, 0.55)',
  },
  tileTitle: {
    color: 'rgba(240, 230, 206, 0.95)',
    fontSize: 13,
    fontWeight: '600',
  },
  tileTag: {
    color: 'rgba(240, 230, 206, 0.5)',
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  tileTagFree: {
    color: '#d8b36a',
  },
  previewRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  mockClockWrap: {
    alignItems: 'center',
    marginTop: 64,
  },
  mockDate: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  mockClock: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 84,
    fontWeight: '300',
    marginTop: -4,
  },
  previewClose: {
    position: 'absolute',
    top: 56,
    right: 16,
  },
  previewActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  saveButton: {
    backgroundColor: '#d8b36a',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 13,
    minWidth: 200,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#1a1410',
    fontSize: 16,
    fontWeight: '700',
  },
  previewHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
