import * as SecureStore from 'expo-secure-store';

const NAME_STORAGE = 'user_first_name';
const ABOUT_STORAGE = 'user_about';
const ONBOARDED_STORAGE = 'onboarded_v1';
const MODE_STORAGE = 'listener_mode';

/** Who's listening: how he speaks adapts — simpler, gentler, always
 * kid-safe when a child is on the other side. */
export type ListenerMode = 'adult' | 'kids';

let userName: string | null = null;
let aboutMe: string | null = null;
let onboarded = false;
let listenerMode: ListenerMode = 'adult';

export function getMode(): ListenerMode {
  return listenerMode;
}

export async function setMode(mode: ListenerMode): Promise<void> {
  listenerMode = mode;
  try {
    await SecureStore.setItemAsync(MODE_STORAGE, mode);
  } catch {
    // Storage unavailable — mode still applies this session.
  }
}

export async function loadName(): Promise<string | null> {
  try {
    userName = await SecureStore.getItemAsync(NAME_STORAGE);
  } catch {
    userName = null;
  }
  return userName;
}

export async function setName(name: string): Promise<void> {
  const trimmed = name.trim();
  userName = trimmed || null;
  try {
    if (trimmed) {
      await SecureStore.setItemAsync(NAME_STORAGE, trimmed);
    } else {
      await SecureStore.deleteItemAsync(NAME_STORAGE);
    }
  } catch {
    // Storage unavailable — name still applies this session.
  }
}

export function getName(): string | null {
  return userName;
}

export async function loadProfile(): Promise<{
  name: string | null;
  onboarded: boolean;
}> {
  await loadName();
  try {
    aboutMe = await SecureStore.getItemAsync(ABOUT_STORAGE);
    onboarded = (await SecureStore.getItemAsync(ONBOARDED_STORAGE)) === 'yes';
    listenerMode =
      (await SecureStore.getItemAsync(MODE_STORAGE)) === 'kids'
        ? 'kids'
        : 'adult';
  } catch {
    aboutMe = null;
    onboarded = false;
  }
  return { name: userName, onboarded };
}

export async function setAbout(text: string): Promise<void> {
  const trimmed = text.trim();
  aboutMe = trimmed || null;
  try {
    if (trimmed) {
      await SecureStore.setItemAsync(ABOUT_STORAGE, trimmed);
    } else {
      await SecureStore.deleteItemAsync(ABOUT_STORAGE);
    }
  } catch {
    // Storage unavailable — applies this session only.
  }
}

export function getAbout(): string | null {
  return aboutMe;
}

export async function markOnboarded(): Promise<void> {
  onboarded = true;
  try {
    await SecureStore.setItemAsync(ONBOARDED_STORAGE, 'yes');
  } catch {
    // Storage unavailable — will re-ask next launch.
  }
}

export function isOnboarded(): boolean {
  return onboarded;
}
