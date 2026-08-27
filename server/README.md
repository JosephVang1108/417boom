# Abide backend server

Holds the real Claude and ElevenLabs API keys so the mobile app never
ships or stores them, and streams voice audio for faster playback.

## Endpoints

| Endpoint | What it does |
|---|---|
| `POST /v1/messages` | Claude chat (Anthropic wire-compatible — the app's SDK points here) |
| `GET /tts?text=…&story=1` | Text-to-speech, streamed as it generates |
| `POST /stt` | Speech-to-text (`{ audioBase64, mimeType }`) |
| `GET /health` | Liveness check |

Every request (except `/health`) must present the shared app token in the
`x-api-key` header or `?token=` query parameter.

## Environment variables

| Variable | Value |
|---|---|
| `APP_TOKEN` | Any long random string — the app presents this instead of real keys |
| `ANTHROPIC_API_KEY` | Your Claude key (`sk-ant-…`) |
| `ELEVENLABS_API_KEY` | Your ElevenLabs key |
| `VOICE_ID` | *(optional)* ElevenLabs voice id; defaults to the Abide voice |
| `PORT` | *(optional)* defaults to 8787 |

## Deploying on Render (simplest path)

1. Create a free account at https://render.com (sign in with GitHub).
2. **New → Web Service** → connect the `417boom` repository.
3. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Starter ($7/mo) — the free tier sleeps between
     requests, which adds ~30s cold starts users would feel.
4. Add the environment variables from the table above
   (generate `APP_TOKEN` at https://www.uuidgenerator.net or similar).
5. Deploy. Render gives you a URL like `https://abide-server.onrender.com`.
6. Verify: open `https://<your-url>/health` — it should show `{"ok":true}`.

Then give the URL and `APP_TOKEN` to the app configuration (see the app's
backend settings) and the mobile app stops needing any user-entered keys.

## Hardening before public launch

- Per-user accounts and rate limits (the shared token is fine for
  TestFlight, not for the open App Store).
- Restrict `POST /v1/messages` to the app's own model/prompt shape.
- Usage logging so voice spend per user is visible.
