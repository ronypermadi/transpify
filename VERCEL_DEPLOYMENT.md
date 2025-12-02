# 🚀 Vercel Deployment Guide - Transpify

## ✅ Pre-Deployment Checklist

Sebelum deploy, pastikan:
- [x] Development server berjalan dengan baik
- [x] Semua fitur sudah ditest
- [x] Download functionality sudah diperbaiki
- [x] Security implementation sudah production-ready
- [ ] Git repository sudah up-to-date
- [ ] Environment variables sudah siap

---

## 📦 Step 1: Commit & Push ke GitHub

```bash
# Di terminal, jalankan:

# 1. Add semua file
git add .

# 2. Commit dengan message yang jelas
git commit -m "feat: production-ready Transpify with multi-provider API and security"

# 3. Push ke GitHub
git push origin main
```

> **Note**: Jika branch bukan `main`, ganti dengan nama branch Anda (bisa `master` atau lainnya)

---

## 🌐 Step 2: Deploy ke Vercel (Via Dashboard)

### Option A: Vercel Dashboard (Recommended)

1. **Login ke Vercel**
   - Buka https://vercel.com
   - Login dengan GitHub account

2. **Import Project**
   - Click "Add New" → "Project"
   - Pilih repository: `ronypermadi/transpify`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables** (PENTING!)
   
   Add di Vercel Dashboard → Settings → Environment Variables:
   
   ```
   Name: REMOVE_BG_API_KEY
   Value: [your_actual_api_key]
   Environment: Production, Preview, Development
   ```
   
   **Optional APIs** (tambahkan sesuai kebutuhan):
   ```
   CLIPDROP_API_KEY=[your_key]
   GEMINI_API_KEY=[your_key]
   OPENAI_API_KEY=[your_key]
   ```
   
   > ⚠️ **PENTING**: Jangan gunakan prefix `VITE_`! API keys harus backend-only.

5. **Deploy**
   - Click "Deploy"
   - Tunggu ~2-3 menit
   - Vercel akan memberikan URL production: `transpify.vercel.app` atau custom domain

---

## 🔧 Step 3: Deploy ke Vercel (Via CLI)

### Option B: Vercel CLI

```bash
# 1. Install Vercel CLI (jika belum)
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd /home/developer/js_dev/rionapp/transpify
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - What's your project's name? transpify
# - In which directory is your code located? ./
# - Want to override settings? No

# 4. Production deployment
vercel --prod
```

---

## ⚙️ Vercel Configuration

File `vercel.json` sudah dikonfigurasi dengan:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

---

## 🔐 Environment Variables Setup

### Getting API Keys:

1. **Remove.bg** (Recommended)
   - https://www.remove.bg/api
   - Free: 50 requests/month
   - Copy API key

2. **ClipDrop** (Optional)
   - https://clipdrop.co/apis
   - Premium quality
   - Copy API key

3. **Gemini** (Experimental)
   - https://makersuite.google.com/app/apikey
   - Free tier available
   - Copy API key

4. **OpenAI** (Experimental)
   - https://platform.openai.com/api-keys
   - Paid service
   - Copy API key

### Adding to Vercel:

```
Vercel Dashboard → Your Project → Settings → Environment Variables

Add each key:
┌─────────────────────┬──────────────────┬─────────────────────────┐
│ Name                │ Value            │ Environment             │
├─────────────────────┼──────────────────┼─────────────────────────┤
│ REMOVE_BG_API_KEY   │ sk-abc123...     │ Production, Preview     │
│ CLIPDROP_API_KEY    │ xyz789...        │ Production, Preview     │
│ GEMINI_API_KEY      │ def456...        │ Production, Preview     │
│ OPENAI_API_KEY      │ sk-proj-...      │ Production, Preview     │
└─────────────────────┴──────────────────┴─────────────────────────┘
```

> **Redeploy** setelah menambahkan environment variables!

---

## ✅ Post-Deployment Verification

### 1. Test Deployment

Visit your Vercel URL dan test:

- [ ] Landing page loads
- [ ] Navigate to Background Remover
- [ ] Upload test image
- [ ] Process with Browser Mode (should work without API key)
- [ ] Download result - check file extension
- [ ] Test Compressor tool
- [ ] Test Converter tool
- [ ] Test Cropper tool

### 2. Verify Security

Open DevTools → Console:
```javascript
// Should be undefined (secure!)
console.log(import.meta.env.REMOVE_BG_API_KEY);
```

### 3. Check API Mode

If you added API keys:
- [ ] Select API Mode
- [ ] Choose Remove.bg provider
- [ ] Upload and process
- [ ] Should work without errors

### 4. Monitor

Vercel Dashboard → Your Project → Analytics:
- Check request counts
- Monitor errors
- Review performance

---

## 🔄 Continuous Deployment

Vercel automatically deploys on Git push:

```bash
# Make changes
git add .
git commit -m "fix: improve performance"
git push origin main

# Vercel automatically deploys!
```

---

## 🎯 Custom Domain (Optional)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `transpify.yourdomain.com`
3. Update DNS records as instructed by Vercel
4. SSL certificate automatically provisioned

---

## 🐛 Troubleshooting

### Build Fails?

Check Vercel build logs:
```
Vercel Dashboard → Deployments → [Latest] → View Details
```

Common issues:
- Missing dependencies in package.json
- Build command incorrect
- Node version mismatch

### API Not Working?

1. Check environment variables are set
2. Verify no `VITE_` prefix
3. Redeploy after adding env vars
4. Check function logs in Vercel

### Download Extension Issue?

This should be fixed now, but if persists:
- Check browser compatibility
- Try different browser
- Check console for errors

---

## 📊 Deployment Summary

| Aspect | Status |
|--------|--------|
| **Frontend** | ✅ React + Vite + Tailwind |
| **Backend** | ✅ Vercel Serverless Functions |
| **Security** | ✅ Backend-only API keys |
| **Rate Limiting** | ✅ 10 req/min per IP |
| **Multi-Provider** | ✅ 4 API options + Browser |
| **Production Ready** | ✅ YES |

---

## 🎉 You're Ready to Deploy!

**Quick Deploy Command:**
```bash
cd /home/developer/js_dev/rionapp/transpify
git add .
git commit -m "feat: production deployment"
git push origin main
vercel --prod
```

**Or use Vercel Dashboard** for easier setup (recommended for first deployment)

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html
- Issues? Check: https://github.com/ronypermadi/transpify/issues

**Good luck! 🚀**
