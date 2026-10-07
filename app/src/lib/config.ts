// Backend configuration.
//
// When BACKEND_URL and BACKEND_TOKEN are set, the app talks to the
// Jireh server (which holds the real Claude/ElevenLabs keys and streams
// voice audio) and users never enter API keys. When null, the app falls
// back to developer mode: keys entered in settings, direct API calls.
export const BACKEND_URL: string | null = 'https://four17boom.onrender.com';
export const BACKEND_TOKEN: string | null =
  'fjdlkajflkdajsf;ldkjasfl;kdj;lfkajsdl;kfjadls;kjfl;kdsajf;kldjsflkdjsafl;djflds';

export function backendConfigured(): boolean {
  return !!(BACKEND_URL && BACKEND_TOKEN);
}

// Premium gate. False = free tier: one full story (David & Goliath),
// everything else gets a warm taste + invitation. Becomes a real
// subscription check in the store build.
//
// ⚠️ TRUE FOR FAMILY TESTFLIGHT ONLY — every tester gets the full
// Premium experience. MUST be set back to false (or replaced by the
// real subscription check) before the public App Store launch.
export const PREMIUM_UNLOCKED = true;

/** The one story free-tier listeners get in full. */
export const FREE_STORY = 'David and Goliath';
