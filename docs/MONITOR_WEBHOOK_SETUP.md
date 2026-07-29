# Connect a group monitor → SpeedLead (no VA)

SpeedLead already accepts automated posts here:

`POST /api/hooks/posts`

## Headers

```http
Content-Type: application/json
X-Speedlead-Secret: dev-speedlead-hook
```

Use a strong secret in production (`WEBHOOK_SHARED_SECRET`).

## Body

```json
{
  "text": "Anyone know a good plumber in Nixa? Toilet overflowing.",
  "post_url": "https://www.facebook.com/groups/123/posts/456/",
  "group_name": "Nixa Neighbors",
  "source": "groups_watcher",
  "send_sms": true
}
```

## What SpeedLead does

1. Classifies hire vs complaint vs noise  
2. If it’s a real job → texts the shop  
3. Shop opens **Reply on Facebook**

## Partner setup checklist

- [ ] Create monitor account (e.g. Groups Watcher)
- [ ] Add client groups
- [ ] Keyword filter: plumber, plumbing, HVAC, AC, furnace, looking for, recommend, etc.
- [ ] Webhook URL = your SpeedLead `/api/hooks/posts`
- [ ] Shared secret header configured
- [ ] Test with a sample post
- [ ] Confirm SMS arrives on the shop’s cell

## Local test

```bash
curl -X POST http://127.0.0.1:4170/api/hooks/posts \
  -H "Content-Type: application/json" \
  -H "X-Speedlead-Secret: dev-speedlead-hook" \
  -d '{
    "text": "Looking for an HVAC tech, AC not working in Battlefield",
    "group_name": "Springfield Moms",
    "post_url": "https://www.facebook.com/groups/example",
    "source": "monitor_partner",
    "send_sms": false
  }'
```
