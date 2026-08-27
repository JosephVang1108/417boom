import * as SecureStore from 'expo-secure-store';

const NAME_STORAGE = 'user_first_name';

let userName: string | null = null;

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
