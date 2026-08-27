// Backend configuration.
//
// When BACKEND_URL and BACKEND_TOKEN are set, the app talks to the
// Abide server (which holds the real Claude/ElevenLabs keys and streams
// voice audio) and users never enter API keys. When null, the app falls
// back to developer mode: keys entered in settings, direct API calls.
export const BACKEND_URL: string | null = 'https://four17boom.onrender.com';
export const BACKEND_TOKEN: string | null =
  'fjdlkajflkdajsf;ldkjasfl;kdj;lfkajsdl;kfjadls;kjfl;kdsajf;kldjsflkdjsafl;djflds';

export function backendConfigured(): boolean {
  return !!(BACKEND_URL && BACKEND_TOKEN);
}
