# SMS for many clients — you do NOT need one Twilio number each

## Short answer

**No.** One Twilio account + **one sender number** can text all your clients.

| What | How many you need |
|---|---|
| Twilio account | 1 (yours / 417BOOM) |
| Twilio phone number that *sends* alerts | 1 (or a small pool later) |
| Client cell phones that *receive* alerts | 1 per client (their personal phone) |

## How it works when you sell SpeedLead

```text
Facebook post matches HVAC/plumbing hire intent
        │
        ▼
SpeedLead (your server)
        │
        ▼
ONE Twilio number  ──SMS──►  Client A's cell
                     └──SMS──►  Client B's cell
                     └──SMS──►  Client C's cell
```

Each client only stores:

- their business name
- their reply phone (goes in the Facebook comment)
- their **alert phone** (where we text them)

They never see Twilio. They never buy a number.

## Cost picture (rough)

- Twilio number: ~$1.15 / month (you pay once)
- SMS: ~$0.0079 per text (US)
- 50 clients × 100 texts/mo ≈ 5,000 SMS ≈ ~$40 Twilio cost
- You charge $79–$149 / client → strong margin

## When you’d add more numbers

Only later, if:

- volume gets huge (Twilio Messaging Service / number pool)
- you want branded two-way chat per client
- carrier A2P 10DLC throughput needs it

For launch: **one number is enough.**

## US compliance note

For real production SMS in the US you’ll register A2P 10DLC once under 417BOOM (or the product brand). Still one brand — many end recipients. Not one registration per plumber.
