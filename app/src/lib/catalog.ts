// Remote content catalog — so new sermons, stories, and wallpapers can
// ship WITHOUT an app release. The app renders its bundled lists
// instantly, then fetches catalog.json from the media host (same R2
// bucket as the videos, free egress) and swaps in whatever it finds.
// The fetched copy is cached so a cold offline start still shows the
// newest catalog the phone has ever seen. Weekly content lands by
// uploading one JSON file; Apple is not involved.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RECORDED_SERMONS, RECORDED_STORIES, RecordedSermon } from './media';
import { Wallpaper, WALLPAPERS } from './wallpapers';

const CATALOG_URL = 'https://media.jirehbible.com/catalog.json';
const CACHE_KEY = 'remote_catalog_v1';

export interface Catalog {
  sermons: RecordedSermon[];
  stories: RecordedSermon[];
  wallpapers: Wallpaper[];
}

export const BUNDLED_CATALOG: Catalog = {
  sermons: RECORDED_SERMONS,
  stories: RECORDED_STORIES,
  wallpapers: WALLPAPERS,
};

// Remote icons arrive as https URLs (Medallion renders either); anything
// else falls back to a bundled medallion so a typo in the catalog can't
// crash a shelf.
const DEFAULT_ICON = require('../../assets/media/s-david.jpg');

function video(raw: any): RecordedSermon | null {
  if (!raw || typeof raw.id !== 'string' || typeof raw.url !== 'string')
    return null;
  if (!raw.url.startsWith('https://')) return null;
  return {
    id: raw.id,
    title: String(raw.title ?? ''),
    tagline: String(raw.tagline ?? ''),
    minutes: Number(raw.minutes) || 0,
    url: raw.url,
    icon:
      typeof raw.icon === 'string' && raw.icon.startsWith('https://')
        ? raw.icon
        : DEFAULT_ICON,
    emoji: String(raw.emoji ?? '📖'),
    free: raw.free === true,
  };
}

function wallpaper(raw: any): Wallpaper | null {
  if (!raw || typeof raw.id !== 'string') return null;
  return {
    id: raw.id,
    title: String(raw.title ?? ''),
    verse: String(raw.verse ?? ''),
    reference: String(raw.reference ?? ''),
    free: raw.free === true,
  };
}

function parseCatalog(json: unknown): Catalog | null {
  const c = json as any;
  if (!c || typeof c !== 'object') return null;
  const sermons = (Array.isArray(c.sermons) ? c.sermons : [])
    .map(video)
    .filter((s: RecordedSermon | null): s is RecordedSermon => !!s);
  const stories = (Array.isArray(c.stories) ? c.stories : [])
    .map(video)
    .filter((s: RecordedSermon | null): s is RecordedSermon => !!s);
  const wallpapers = (Array.isArray(c.wallpapers) ? c.wallpapers : [])
    .map(wallpaper)
    .filter((w: Wallpaper | null): w is Wallpaper => !!w);
  // An empty or broken catalog never beats the bundled one.
  if (!sermons.length && !stories.length && !wallpapers.length) return null;
  return {
    sermons: sermons.length ? sermons : BUNDLED_CATALOG.sermons,
    stories: stories.length ? stories : BUNDLED_CATALOG.stories,
    wallpapers: wallpapers.length ? wallpapers : BUNDLED_CATALOG.wallpapers,
  };
}

// One fetch per app run, shared by every shelf that asks.
let refreshPromise: Promise<Catalog | null> | null = null;
function refresh(): Promise<Catalog | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(CATALOG_URL, {
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return null;
        const raw = await res.text();
        const parsed = parseCatalog(JSON.parse(raw));
        if (parsed) await AsyncStorage.setItem(CACHE_KEY, raw).catch(() => {});
        return parsed;
      } catch {
        return null;
      }
    })();
  }
  return refreshPromise;
}

/** The current catalog: bundled instantly, cached next tick, live when
 * the fetch lands. Shelves re-render as better data arrives. */
export function useCatalog(): Catalog {
  const [catalog, setCatalog] = useState<Catalog>(BUNDLED_CATALOG);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && alive) {
          const parsed = parseCatalog(JSON.parse(cached));
          if (parsed) setCatalog(parsed);
        }
      } catch {}
      const fresh = await refresh();
      if (fresh && alive) setCatalog(fresh);
    })();
    return () => {
      alive = false;
    };
  }, []);
  return catalog;
}
