# 🔒 Production Security Guide - Transpify

## ✅ Security Architecture Overview

Transpify menggunakan **backend proxy pattern** untuk memastikan API keys tidak pernah exposed ke client-side code.

### Architecture Diagram

```
┌─────────────┐      HTTPS      ┌──────────────────┐      API Call      ┌──────────────┐
│   Browser   │ ───────────────> │  Vercel Backend  │ ─────────────────> │  External    │
│  (Client)   │                  │  (Serverless)    │                    │  API         │
│             │                  │  🔐 API Keys     │                    │  (Remove.bg) │
└─────────────┘                  └──────────────────┘                    └──────────────┘
     ↑                                    ↓
     └────────── Processed Image ─────────┘
```

**Key Points:**
- ✅ Browser NEVER sees API keys
- ✅ All API calls go through YOUR backend
- ✅ Rate limiting prevents abuse
- ✅ Environment variables on server only

---

## 🚫 What NOT to Do (Security Anti-Patterns)

### ❌ NEVER Store API Keys in Browser

```javascript
// ❌ WRONG - API key exposed in client code
localStorage.setItem('api_key', 'sk-abc123...');

// ❌ WRONG - API key visible in JavaScript
const API_KEY = 'sk-abc123...';

// ❌ WRONG - VITE_ prefix exposes to client
VITE_API_KEY=sk-abc123...  // This gets bundled!
```

**Why it's dangerous:**
- Anyone can open DevTools and see the key
- XSS attacks can steal the key
- Keys can be extracted from bundled JavaScript
- Users can abuse your quota/credits

### ❌ NEVER Commit API Keys to Git

```bash
# ❌ WRONG - .env file committed
git add .env
git commit -m "Add environment variables"

# ✅ CORRECT - .env in .gitignore
echo ".env" >> .gitignore
```

**If you accidentally committed API keys:**
1. **Immediately revoke** the key from provider dashboard
2. Generate new API key
3. Remove from Git history: `git filter-branch` or BFG Repo-Cleaner
4. Rotate all potentially compromised credentials

---

## ✅ Correct Implementation (Current Architecture)

### 1. Environment Variables (Backend Only)

```env
# .env file (NEVER commit this!)
# No VITE_ prefix = Server-side only = Secure

REMOVE_BG_API_KEY=sk-abc123def456...
CLIPDROP_API_KEY=xyz789...
```

**Why this is secure:**
- No `VITE_` prefix means Vite won't bundle it
- Only accessible on server-side code
- Not visible in browser DevTools
- Not in client JavaScript bundle

### 2. Backend API Endpoint

```javascript
// api/remove-background.js
export default async function handler(req, res) {
  // API key accessed server-side only
  const apiKey = process.env.REMOVE_BG_API_KEY;
  
  // Call external API from server
  const response = await axios.post('https://api.remove.bg/...', {
    headers: { 'X-Api-Key': apiKey }
  });
  
  return res.json({ image: result });
}
```

### 3. Frontend Calls Backend Only

```javascript
// src/components/BackgroundRemover.jsx
// Never accesses API keys directly!
const response = await axios.post('/api/remove-background', {
  image: imageData,
  provider: 'removebg'
});
```

---

## 🛡️ Security Features Implemented

### 1. **Rate Limiting**

```javascript
// Prevents API abuse
const RATE_LIMIT = 10; // requests per minute per IP
const RATE_WINDOW = 60000; // 1 minute
```

**Benefits:**
- Prevents DDoS attacks
- Protects your API quota
- Reduces server costs

### 2. **Input Validation**

```javascript
// Validates all inputs
if (!image) {
  return res.status(400).json({ error: 'No image provided' });
}

// File size limits
maxSize: 10485760 // 10MB
```

### 3. **Error Handling**

```javascript
// Never exposes sensitive errors to client
catch (error) {
  console.error('Server error:', error); // Server logs only
  return res.json({ 
    error: 'Processing failed' // Generic message to client
  });
}
```

### 4. **HTTPS Only**

- All communication encrypted
- Vercel provides SSL certificates automatically
- API keys transmitted securely

---

## 📋 Production Deployment Checklist

### Before Deploying to Vercel:

- [ ] ✅ Verify `.env` is in `.gitignore`
- [ ] ✅ Verify no `VITE_` prefix on API keys
- [ ] ✅ Remove any hardcoded API keys from code
- [ ] ✅ Test locally with backend proxy
- [ ] ✅ Check rate limiting works
- [ ] ✅ Review all error messages (no sensitive info leaked)

### On Vercel Dashboard:

1. **Go to Project Settings → Environment Variables**
2. **Add each variable:**
   ```
   Name: REMOVE_BG_API_KEY
   Value: [paste your actual key]
   Environment: Production, Preview, Development
   ```
3. **Repeat for all providers you want:**
   - `CLIPDROP_API_KEY`
   - `GEMINI_API_KEY` (optional)
   - `OPENAI_API_KEY` (optional)
4. **Deploy/Redeploy**

### After Deployment:

- [ ] ✅ Test background removal works
- [ ] ✅ Check browser DevTools - no keys visible
- [ ] ✅ Verify rate limiting (make 11 requests quickly)
- [ ] ✅ Test error handling
- [ ] ✅ Monitor API usage on provider dashboards

---

## 🔍 Security Verification

### How to Verify Your Deployment is Secure:

#### Test 1: Check Browser DevTools
```javascript
// Open DevTools → Console
// Try to access API keys
console.log(import.meta.env.REMOVE_BG_API_KEY); // Should be undefined!

// Check localStorage
localStorage.getItem('api_key'); // Should be null
```

#### Test 2: Inspect Network Requests
```
1. Open DevTools → Network tab
2. Upload image and process
3. Check request to /api/remove-background
4. Verify NO API keys in:
   - Request headers
   - Request payload
   - Response body
```

#### Test 3: Check Source Code
```
1. View Page Source (Ctrl+U)
2. Search for "api_key", "sk-", your provider names
3. Should find NOTHING
```

#### Test 4: Check Bundle
```bash
# Build production bundle
npm run build

# Search for API keys in bundle
grep -r "REMOVE_BG_API_KEY" dist/
# Should return empty!
```

---

## 🚨 Incident Response

### If API Key is Compromised:

1. **Immediate Actions (within 5 minutes):**
   - Revoke compromised key from provider dashboard
   - Check recent usage/charges
   - Generate new API key

2. **Investigation (within 1 hour):**
   - Review Git history for exposed keys
   - Check application logs for suspicious activity
   - Scan for unauthorized charges

3. **Remediation (within 24 hours):**
   - Update all systems with new key
   - Remove key from Git history if committed
   - Document incident and learnings
   - Review security practices

4. **Prevention:**
   - Implement secret scanning (GitHub Secret Scanning)
   - Add pre-commit hooks to detect secrets
   - Regular security audits

---

## 📊 Comparison: Before vs After Security Refactor

| Aspect | ❌ Before (Insecure) | ✅ After (Secure) |
|--------|---------------------|-------------------|
| **API Keys** | `VITE_API_KEY` (exposed) | `API_KEY` (backend only) |
| **Client Access** | Direct to external APIs | Via backend proxy |
| **Visibility** | Visible in DevTools | Never exposed |
| **Rate Limiting** | None | 10 req/min per IP |
| **Abuse Risk** | High | Low |
| **Production Ready** | ❌ No | ✅ Yes |

---

## 🎓 Security Best Practices Summary

### DO ✅
- Store API keys on server only (no `VITE_` prefix)
- Use backend proxy for all external API calls
- Implement rate limiting
- Validate all inputs
- Use HTTPS only
- Monitor API usage regularly
- Rotate keys periodically

### DON'T ❌
- Store keys in localStorage/sessionStorage
- Use `VITE_` prefix for sensitive keys
- Hardcode keys in source code
- Commit `.env` files to Git
- Expose sensitive errors to users
- Trust client-side validation only
- Share keys in screenshots/logs

---

## 📚 Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Vercel Environment Variables Guide](https://vercel.com/docs/environment-variables)
- [API Key Security Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

## ✅ Security Status

**Current Implementation:**
- 🔒 **Backend Proxy Pattern**: ✅ Implemented
- 🔒 **Rate Limiting**: ✅ Active (10 req/min)
- 🔒 **Input Validation**: ✅ Implemented
- 🔒 **Error Handling**: ✅ Secure
- 🔒 **HTTPS Only**: ✅ Via Vercel
- 🔒 **No Client Exposure**: ✅ Verified

**Production Ready**: ✅ **YES**

---

**Last Updated**: 2025-12-02
**Security Level**: 🛡️ **Production Grade**
