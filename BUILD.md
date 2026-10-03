# Abba — TestFlight Build Guide

Follow these steps **in order** on the PC. Each step says exactly what to
paste. If anything errors, stop and paste the error into Claude Code.

---

## Step 1 — Get the latest code

```powershell
cd C:\Users\josep\417boom\app
git pull
npm install
```

## Step 2 — Put the app icon in place

The chosen icon: **half his face in golden light, slim gold cross on the
left border**. Run these three lines:

```powershell
Invoke-WebRequest "https://g.tlcdn.com/gen/2540121a1f344e16bb236933557902e5.png" -OutFile assets\icon.png
Invoke-WebRequest "https://g.tlcdn.com/gen/2540121a1f344e16bb236933557902e5.png" -OutFile assets\splash-icon.png
Invoke-WebRequest "https://g.tlcdn.com/gen/2540121a1f344e16bb236933557902e5.png" -OutFile assets\android-icon-foreground.png
```

Then commit the icon so it's saved:

```powershell
git add assets
git commit -m "Abba app icon"
git push
```

## Step 3 — Install the Expo build tool and log in

```powershell
npm install -g eas-cli
eas login
```

Log in as **jv0621** (same account as Expo Go).

## Step 4 — Create the Expo project link

```powershell
eas init
```

Say **Yes** when it asks to create a project. This writes a project ID
into app.json — commit it:

```powershell
git add app.json
git commit -m "Link EAS project"
git push
```

## Step 5 — Build the real app ☁️

```powershell
eas build --platform ios --profile production
```

- It will ask to log in to your **Apple account** — use the Apple ID that
  has the Developer membership.
- Say **Yes** to letting EAS create certificates/profiles (it handles all
  of Apple's signing mess automatically).
- The build runs in Expo's cloud, ~15–25 minutes. You can close PowerShell
  and watch at https://expo.dev — or just leave it open.

## Step 6 — Create the app in App Store Connect (one time)

While the build runs, in a browser:

1. Go to https://appstoreconnect.apple.com → **My Apps** → **+** → **New App**
2. Platform: iOS · Name: **Abba** (if taken, try "Abba — Talk, Pray, Abide"
   or "Abba: God With You" — the home-screen name stays just "Abba")
3. Primary language: English (U.S.)
4. Bundle ID: pick **com.fourseventeenboom.abba** from the dropdown
   (it appears after Step 5's signing setup; refresh if missing)
5. SKU: `abba-001`

## Step 7 — Send the build to TestFlight

When Step 5 finishes:

```powershell
eas submit --platform ios --latest
```

Answer the prompts (it reuses your Apple login). ~10 minutes later the
build appears in App Store Connect → **TestFlight**. Apple takes a few
minutes to "process" it, then you add yourself as a tester and install
the real Abba app from the TestFlight app on your phone.

---

## What comes after the first TestFlight install

- [ ] Media bundling (portraits/videos/medallions into the app — no more
      streaming hiccups)
- [ ] Sign in with Apple + Google
- [ ] Subscriptions (RevenueCat, $9.99/mo / $59.99/yr, 7-day trial)
- [ ] Server hardening: rotate APP_TOKEN, per-user caps
- [ ] Widgets + Routines
- [ ] Historical portrait + "How do you picture him?" chooser
- [ ] Invite the first testers (friends, family, the pilot churches)
