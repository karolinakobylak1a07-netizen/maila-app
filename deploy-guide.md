# 🚀 Deployment Guide: Vercel + Neon

## Quick Setup (5 minutes)

### 1. Create Neon Database (Cloud PostgreSQL)

1. Go to https://neon.tech
2. Click "Sign Up" (use GitHub/Google for quick signup)
3. Create a new project:
   - Name: `maila-app` (or any name)
   - Region: Choose closest to your users
4. Copy the **Connection String** (looks like: `postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require`)

### 2. Deploy to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" (use GitHub/Google)
3. Click "Add New Project"
4. Import your GitHub repository or upload the project
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `app`
   - **Install Command:** `npm install`
   - **Build Command:** `npm run build`
   - **Output Directory:** (leave blank - Next.js handles this)

### 3. Set Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
DATABASE_URL=your_neon_connection_string_here
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app
CLIENT_KEYS_ENCRYPTION_SECRET=your_encryption_key
```

### 4. Run Database Migrations

After deployment, run migrations via Vercel CLI or SSH:

```bash
npx prisma db push
```

### 5. Done!

Your app will be live at: `https://your-app-name.vercel.app`

---

## One-Command Deploy (if you have Vercel CLI installed)

```bash
cd app
npx vercel
```

Follow the prompts and enter your Neon DATABASE_URL when asked.
