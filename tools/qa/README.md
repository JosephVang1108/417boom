# In-browser QA rig

Runs the app as a web build inside headless Chromium and drives it like
a user — onboarding, mood check-in, chat, prayer, Bible, Journey —
screenshotting every step and logging every console error. No API keys
and no real backend needed: a mock server speaks the Anthropic wire
format with canned replies.

## How to run (from the repo root)

```bash
# 1. point the app at the local mock (do NOT commit this change)
sed -i "s|https://four17boom.onrender.com|http://127.0.0.1:8787|" app/src/lib/config.ts

# 2. fix obscenity's broken ESM entry for web bundling (node_modules only)
node -e "const f='app/node_modules/obscenity/package.json',j=require('./'+f);j.exports.import.default='./dist/index.js';j.module='./dist/index.js';require('fs').writeFileSync(f,JSON.stringify(j,null,2))"

# 3. export the web build
cd app && npx expo export --platform web --output-dir ../tools/qa/webbuild && cd ..

# 4. servers + test pass
node tools/qa/mock-server.js &        # mock backend on :8787
node tools/qa/static-server.js &      # web build on :8080 (expects ../webbuild)
node tools/qa/fullpass.js             # drives the app, shots in ./shots/

# 5. afterwards: revert the config patch
git checkout app/src/lib/config.ts
```

Requires `playwright-core` (npm install playwright-core) and a Chromium
binary (`/opt/pw-browsers/chromium` in the Claude cloud container —
adjust `executablePath` elsewhere).

## Known rig limitations (not app bugs)

- Playwright's open-source Chromium has no H.264 codec, so the idle
  portrait/praying loop videos log `NotSupportedError` and don't play.
  They play fine on iPhones (verified in TestFlight builds 6–8).
- expo-notifications, expo-secure-store and haptics are no-ops on web;
  the app already guards them.
- Voice (TTS) returns a silent clip from the mock.

## Why the web build needs those package.json additions

`react-dom`, `react-native-web` and `@expo/metro-runtime` are required
by `expo export --platform web`. They are web-only at runtime and do
not change the iOS build. `react-dom` must match `react`'s exact
installed version or the app white-screens (React error #527).
