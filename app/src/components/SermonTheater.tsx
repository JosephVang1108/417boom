import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { stop as stopSpeaking } from '../lib/voice';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif' });

interface Props {
  title: string;
  url: string;
  onClose: () => void;
}

/**
 * Full-screen theater for a recorded sermon — a real render of him
 * preaching, streamed. Mount it only when there is something to play;
 * mounting starts playback.
 */
export default function SermonTheater({ title, url, onClose }: Props) {
  const player = useVideoPlayer(url, (p) => {
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  // He shouldn't talk over himself — quiet the live voice first.
  useEffect(() => {
    stopSpeaking();
  }, []);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls
        />
        {/* Streaming takes a breath to start. */}
        {status === 'loading' && (
          <View style={styles.loading} pointerEvents="none">
            <ActivityIndicator color="#C9AE6E" size="large" />
          </View>
        )}
        {status === 'error' && (
          <View style={styles.loading} pointerEvents="none">
            <Text style={styles.errorText}>
              This sermon couldn't load. Check your connection and try
              again.
            </Text>
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FBF5E7',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: SERIF,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  title: {
    color: '#FBF5E7',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: SERIF,
    flex: 1,
    marginRight: 12,
  },
  close: {
    color: '#C9AE6E',
    fontSize: 15,
  },
});
