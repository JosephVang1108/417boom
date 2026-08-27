# Abide — a Jesus companion app

A mobile app with a gentle animated face that follows you, listens to what's
on your heart, and responds with comfort and Bible verses matched to what you
share.

Built with **React Native + Expo (TypeScript)** — one codebase for iPhone and
Android. The app lives in the [`app/`](app/) folder.

## What it does today (MVP)

- **Animated face** — drawn in SVG, it blinks, idly gazes around, and its eyes
  follow your finger when you touch it. The mouth moves while it speaks and
  the brows lift when it's listening.
- **Listens & responds** — type what's on your heart; a topic-matching engine
  recognizes themes (worry, grief, loneliness, guilt, anger, hope, weariness,
  guidance, gratitude, and more) and replies with a warm word plus a matching
  scripture passage.
- **Speaks aloud** — responses are read out with text-to-speech (toggleable),
  and the face's mouth animates in sync.
- **Scripture** — verses use the World English Bible (WEB), a public-domain
  translation, so there are no licensing issues.
- **AI conversations (optional)** — add an Anthropic API key in the ⚙️
  settings and responses are powered by Claude: real understanding, real
  multi-turn conversation, with a fitting verse chosen for each reply. The
  key is stored securely on-device (`expo-secure-store`), and the app falls
  back to the offline verse engine whenever AI is unavailable. For a public
  release, route API calls through your own backend instead of shipping
  user-entered keys.

## Run it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On your computer:

   ```bash
   cd app
   npm install
   npx expo start
   ```

3. Scan the QR code with your phone (Camera app on iOS, Expo Go on Android).

## Project structure

```
app/
├── App.tsx                          # Main screen: face, conversation, input bar
├── metro.config.js                  # Shims Node builtins for the Anthropic SDK
└── src/
    ├── components/JesusFace.tsx     # Animated SVG face (gaze, blink, talk)
    ├── components/SettingsModal.tsx # API key entry for AI mode
    ├── data/verses.ts               # Topical scripture database (WEB translation)
    ├── lib/ai.ts                    # Claude-powered conversations (structured output)
    └── lib/guide.ts                 # Offline topic matching + response composition
```

## Roadmap ideas (phase 2)

- **Voice input** — real speech-to-text via `expo-speech-recognition`
  (requires an Expo dev build rather than Expo Go).
- **Backend proxy for AI** — move the Claude API call server-side so
  customers don't need their own API key.
- **Face tracking** — use the front camera so the eyes literally follow the
  user's face.
- **Daily verse notifications**, prayer journal, and favorites.
