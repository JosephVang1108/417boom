import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, Text } from 'react-native';

interface Props {
  /** Bundled medallion artwork (require()d), or a remote URL for
   * newly added medallions awaiting their next bundling pass. */
  source: number | string;
  size: number;
  /** Emoji shown only if the artwork fails to render. */
  fallback: string;
  style?: StyleProp<ImageStyle>;
}

/**
 * One of the app's hand-painted medallion icons (an illuminated-
 * manuscript set bundled with the app). Rendered as a circle; falls
 * back to an emoji if the artwork can't render.
 */
export default function Medallion({ source, size, fallback, style }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Text style={{ fontSize: size * 0.72 }}>{fallback}</Text>;
  }
  return (
    <Image
      source={typeof source === 'string' ? { uri: source } : source}
      onError={() => setFailed(true)}
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}
