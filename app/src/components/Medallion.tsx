import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, Text } from 'react-native';

interface Props {
  uri: string;
  size: number;
  /** Emoji shown only if the artwork fails to load. */
  fallback: string;
  style?: StyleProp<ImageStyle>;
}

/**
 * One of the app's hand-painted medallion icons (generated as a matched
 * illuminated-manuscript set). Rendered as a circle; falls back to an
 * emoji if the artwork can't load.
 */
export default function Medallion({ uri, size, fallback, style }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Text style={{ fontSize: size * 0.72 }}>{fallback}</Text>;
  }
  return (
    <Image
      source={{ uri }}
      onError={() => setFailed(true)}
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}
