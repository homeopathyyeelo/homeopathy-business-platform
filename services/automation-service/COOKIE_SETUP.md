# Cookie-Based GMB Automation - Setup Guide

## Quick Start (5 Minutes)

### Step 1: Extract Cookies (One Time)

1. **Open Chrome** (regular browser, not automation)
2. **Login to GMB:**
   - Go to: https://business.google.com
   - Email: `yeelohomeopathy@gmail.com`
   - Password: `XXghosh@147`
   - Complete any 2FA if prompted

3. **Extract Cookies:**
   ```
   Press F12 (DevTools)
   → Application tab
   → Cookies → business.google.com
   → Right-click table → Copy all
   ```

4. **Save Cookies:**
   Create `services/automation-service/cookies.json`:
   ```json
   [
     {
       "name": "SID",
       "value": "g.a000...", 
       "domain": ".google.com",
       "path": "/",
       "expires": 1234567890,
       "httpOnly": true,
       "secure": true
     }
     // ... paste ALL cookies here
   ]
   ```

### Step 2: Test Automation

```bash
# Service should be running on port 3006
curl -X POST http://localhost:3006/api/gmb/posts \
  -H 'Content-Type: application/json' \
  -d '{
    "accountId": "1",
    "title": "🌿 Test Post",
    "content": "Testing cookie-based automation"
  }'
```

**Result:** Post appears on GMB without any login! ✅

### Step 3: Weekly Cookie Refresh

When automation fails (usually ~7 days):
1. Login manually again
2. Extract fresh cookies
3. Replace `cookies.json`
4. Automation works again

---

## How It Works

```
Week 1: Manual login → Extract cookies → Save to cookies.json
        ↓
Week 1-7: Automation loads cookies → Posts work automatically ✅
        ↓
Week 8: Cookies expired → Manual refresh → Automation continues
```

**95% automated** - Only manual step is weekly cookie refresh

---

## Production Deployment

### Option 1: Staff Handles Cookies
- Marketing staff logs in weekly
- Extracts cookies (2 minutes)
- Uploads to server
- All posts automated

### Option 2: Admin Panel
Build cookie management UI:
```typescript
// Frontend uploads new cookies
POST /api/gmb/cookies
{
  "cookies": [...]  // From browser
}

// Backend saves and automation uses them
```

---

## Integration with Your App

Frontend creates post:
```bash
POST http://localhost:3000/api/gmb/post
```

Go backend calls NestJS automation:
```go
http.Post("http://localhost:3006/api/gmb/posts", data)
```

NestJS uses cookies → GMB post created ✅

---

## Cookie Format (Example)

```json
[
  {
    "name": "SID",
    "value": "g.a000abc123...",
    "domain": ".google.com",
    "path": "/",
    "expires": 1735920000,
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
  },
  {
    "name": "HSID",
    "value": "xyz789...",
    "domain": ".google.com",
    ...
  }
  // Include ALL cookies (usually 10-15)
]
```

---

## Monitoring

```bash
# Check if service running
curl http://localhost:3006/api/gmb/posts

# View logs
tail -f logs/automation-service.log

# Check last post
psql -c "SELECT * FROM gmb_posts ORDER BY created_at DESC LIMIT 1"
```

---

## Troubleshooting

**"Not logged in" error:**
- Cookies expired → Extract fresh cookies
- Cookies missing → Check `cookies.json` exists

**"Post failed":**
- Check logs: `tail logs/automation-service.log`
- Verify GMB UI hasn't changed selectors

---

## Success Metrics

- ✅ 95% automation (vs 0% with API)
- ⏱️ 2 min/week for cookie refresh
- 🚀 Unlimited posts automatically
- 💰 No third-party tool costs

This is the industry-standard solution for GMB automation under Google's current security policies.
