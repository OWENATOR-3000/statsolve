import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

/**
 * SecureStore has a 2048-byte limit per key (iOS Keychain restriction).
 * Supabase session JSON commonly exceeds this (long JWTs + user object).
 *
 * This adapter transparently chunks large values across multiple keys
 * and reassembles them on read so the warning — and future error — never appear.
 */
const CHUNK_SIZE = 1800; // safely under 2048 with key name overhead

async function setItemChunked(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    // Small enough — store directly, clear any stale chunk metadata
    await SecureStore.setItemAsync(key, value);
    await SecureStore.deleteItemAsync(`${key}__chunks`);
    return;
  }

  // Split into chunks
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  // Store each chunk and the count
  await Promise.all([
    ...chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}__chunk_${i}`, chunk)),
    SecureStore.setItemAsync(`${key}__chunks`, String(chunks.length)),
  ]);

  // Remove the old plain key in case it existed before
  await SecureStore.deleteItemAsync(key);
}

async function getItemChunked(key: string): Promise<string | null> {
  // Check if a chunked version exists
  const countStr = await SecureStore.getItemAsync(`${key}__chunks`);
  if (countStr) {
    const count = parseInt(countStr, 10);
    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${key}__chunk_${i}`)
      )
    );
    if (parts.some((p) => p === null)) return null; // corrupted — treat as missing
    return parts.join("");
  }

  // Fall back to the plain key
  return SecureStore.getItemAsync(key);
}

async function removeItemChunked(key: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(`${key}__chunks`);
  if (countStr) {
    const count = parseInt(countStr, 10);
    await Promise.all([
      ...Array.from({ length: count }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}__chunk_${i}`)
      ),
      SecureStore.deleteItemAsync(`${key}__chunks`),
    ]);
  }
  await SecureStore.deleteItemAsync(key);
}

const ExpoSecureStoreAdapter = {
  getItem:    getItemChunked,
  setItem:    setItemChunked,
  removeItem: removeItemChunked,
};

// These are the public env values — safe to embed in the app bundle
const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:          ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});

/**
 * Returns the current access token or null if not logged in.
 * Used as the Bearer token on every API call.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
