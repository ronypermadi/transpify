# GitHub + Vercel Integration Guide

## 🔗 Auto-Deploy dari GitHub ke Vercel

### Status Saat Ini
Project sudah di-deploy ke Vercel dan terhubung dengan GitHub repository `ronypermadi/transpify`.

---

## ✅ Setup GitHub Integration (Vercel Dashboard)

### Langkah 1: Login ke Vercel Dashboard

1. Buka https://vercel.com/dashboard
2. Login dengan akun yang sama dengan yang digunakan untuk CLI
3. Cari project "transpify" di dashboard

### Langkah 2: Verify GitHub Connection

1. **Di Vercel Dashboard** → Pilih project "transpify"
2. **Settings** → **Git**
3. Pastikan terlihat:
   ```
   Connected Git Repository
   GitHub: ronypermadi/transpify
   Branch: main
   ```

### Langkah 3: Configure Auto-Deploy Settings

Di **Settings** → **Git**:

```
✅ Production Branch: main
   - Setiap push ke main → auto deploy production

✅ Preview Deployments: Enabled
   - Setiap PR/branch → auto deploy preview

✅ Automatic Deployments: Enabled
   - Deploy otomatis aktif
```

### Langkah 4: GitHub Integration Permissions

Pastikan Vercel punya akses ke repo:

1. **GitHub.com** → Settings → Applications
2. **Installed GitHub Apps** → Vercel
3. Pastikan `ronypermadi/transpify` tercentang
4. Permissions:
   - ✅ Read access to code
   - ✅ Read and write access to deployments
   - ✅ Read and write access to pull requests

---

## 🧪 Test Auto-Deploy

### Test 1: Small Change

```bash
# Edit README
echo "\n## Auto-Deploy Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify auto-deploy"
git push origin main
```

**Expected Result:**
- Vercel otomatis detect push
- Build dan deploy dimulai (~2-3 menit)
- Notification di email (jika enabled)
- Deployment URL updated

### Test 2: Check Deployment

```bash
# Watch deployments
vercel ls

# Or via dashboard
# https://vercel.com/rionapp/transpify/deployments
```

---

## 📊 Deployment Workflow

```
┌──────────────┐
│  Local Dev   │
│  Make changes│
└──────┬───────┘
       │
       ├─ git add .
       ├─ git commit -m "..."
       ├─ git push origin main
       │
       ▼
┌──────────────┐
│   GitHub     │
│  Repository  │
└──────┬───────┘
       │
       │ Webhook triggers Vercel
       ▼
┌──────────────┐
│    Vercel    │
│  Auto Build  │
└──────┬───────┘
       │
       ├─ Install dependencies
       ├─ Build project (vite build)
       ├─ Deploy to CDN
       │
       ▼
┌──────────────┐
│  Production  │
│  Live URL    │
└──────────────┘
```

---

## ⚙️ Advanced Configuration

### Branch Deployments

Di **Settings** → **Git**, configure:

```json
{
  "production": {
    "branch": "main",
    "auto": true
  },
  "preview": {
    "branches": ["dev", "staging", "feature/*"],
    "auto": true
  }
}
```

### Deploy Hooks (Optional)

Create deploy hook untuk manual trigger:

1. **Settings** → **Git** → **Deploy Hooks**
2. Create Hook:
   - Name: "Manual Deploy"
   - Branch: main
3. Get URL: `https://api.vercel.com/v1/integrations/deploy/...`

Trigger via:
```bash
curl -X POST "https://api.vercel.com/v1/integrations/deploy/..."
```

### Ignore Build Step (Optional)

Tambah di `vercel.json`:
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "dev": false
    }
  }
}
```

---

## 🔔 Notifications

Enable notifications di Vercel:

1. **Account Settings** → **Notifications**
2. Enable:
   - ✅ Deployment Success
   - ✅ Deployment Failed
   - ✅ Build Errors
3. Choose channels:
   - Email
   - Slack (optional)
   - Discord (optional)

---

## 🐛 Troubleshooting

### Auto-Deploy Not Working?

**Check 1: GitHub Webhook**
```
GitHub Repo → Settings → Webhooks
Should see: https://api.vercel.com/v1/integrations/...
Status: ✅ Recent Deliveries successful
```

**Check 2: Vercel Integration**
```
GitHub → Settings → Applications → Vercel
Status: Active
Permissions: Granted
```

**Check 3: Branch Settings**
```
Vercel → Settings → Git → Production Branch
Must match: main (or your default branch)
```

### Build Failed?

Check build logs:
```
Vercel Dashboard → Deployments → [Failed Build] → View Details
```

Common issues:
- Missing dependencies in package.json
- Environment variables not set
- Build command timeout (increase in settings)

### Deployment Slow?

Optimize:
```
Settings → General → Framework Preset: Vite
Settings → Functions → Region: Closest to users
Settings → Build & Development → Node.js Version: 20.x
```

---

## 📈 Monitoring Deployments

### Via CLI
```bash
# List deployments
vercel ls

# Watch logs
vercel logs [deployment-url] --follow

# Check production
vercel inspect [production-url]
```

### Via Dashboard
```
https://vercel.com/rionapp/transpify/deployments

View:
- Deployment history
- Build duration
- Success/fail rate
- Performance metrics
```

---

## 🎯 Best Practices

### 1. Branch Protection
```
GitHub Repo → Settings → Branches → Add Rule
- Require pull request reviews
- Require status checks (Vercel preview)
- Enable auto-merge after checks pass
```

### 2. Preview Deployments
```
Every PR automatically gets preview URL:
- Test changes before merge
- Share with team
- Auto-cleanup after merge
```

### 3. Rollback Strategy
```
Vercel Dashboard → Deployments
- Click any previous deployment
- Click "Promote to Production"
- Instant rollback!
```

### 4. Environment Variables per Branch
```
Settings → Environment Variables
Set different values for:
- Production (main branch)
- Preview (all other branches)
- Development (local only)
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Push to `main` triggers production deploy
- [ ] Push to other branch triggers preview deploy
- [ ] Build success notification received
- [ ] Production URL updates automatically
- [ ] Rollback works from dashboard
- [ ] Environment variables loaded correctly
- [ ] Deployment logs accessible

---

## 🚀 Quick Reference

### Local Development
```bash
npm run dev          # Local dev server
git add .
git commit -m "..."
git push origin main # Auto-deploy to production
```

### Manual Deploy
```bash
vercel              # Preview deployment
vercel --prod       # Production deployment
```

### Check Status
```bash
vercel ls           # List deployments
vercel logs         # View logs
vercel domains      # Check domains
```

---

## 🎉 You're All Set!

**Auto-Deploy is Now Active**

Every `git push origin main` will:
1. ✅ Trigger Vercel build
2. ✅ Run tests (if configured)
3. ✅ Deploy to production
4. ✅ Update live URL
5. ✅ Send notification

**Next Push = Auto Deploy!** 🚀

---

**Helpful Links:**
- Vercel Dashboard: https://vercel.com/rionapp/transpify
- GitHub Repo: https://github.com/ronypermadi/transpify
- Production URL: Check Vercel dashboard
