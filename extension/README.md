# SpeedLead Chrome extension

One-click send from Facebook → SpeedLead matcher → SMS if it’s a real job.

## Install (Chrome)

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → choose this `extension/` folder
4. Open extension **Options** and set:
   - App URL (example: `http://127.0.0.1:4170`)
   - Webhook secret (must match server `WEBHOOK_SHARED_SECRET`)

## Use

1. Open a Facebook group post
2. Optionally highlight the post text
3. Click the SpeedLead extension → **Send to SpeedLead**

This is **user-initiated** (you’re choosing the post). It is not a Facebook OAuth group reader.
