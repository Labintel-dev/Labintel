# Vercel Deployment Step-by-Step Guide

This guide walks through deploying the LabIntel frontend to Vercel.

## Prerequisites

- GitHub account with the Labintel repository
- Vercel account (sign up at https://vercel.com)
- Admin access to the Vercel project

## Step 1: Create a New Vercel Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New..."** → **"Project"**
3. Under "Import Git Repository", click on your GitHub account
4. Search for and select the **Labintel repository**
5. Click **"Import"**

## Step 2: Configure Project Settings

1. **Framework Preset:** Select **"Vite"** (or Next.js if applicable)
2. **Root Directory:** Set to **`frontend`**
   - Vercel will detect the frontend's `package.json` here
3. **Build Command:** Leave as default or ensure it's `npm run build`
4. **Output Directory:** Should be `dist` (Vite default)
5. **Install Command:** Leave as default `npm install`

## Step 3: Set Environment Variables

1. Scroll to **"Environment Variables"** section
2. Add the following variables (get values from your Supabase project):

   | Key | Value | Example |
   |-----|-------|---------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | (found in Supabase Settings → API) |
   | `VITE_API_URL` | Your Render backend API URL | `https://your-backend.onrender.com/api/v1` |

3. **Important:** Prefix all frontend variables with `VITE_` so they're available in the browser
4. Click **"Add"** for each variable

## Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (~2-3 minutes)
3. Once complete, Vercel will provide a **deployment URL** (e.g., `https://labintel.vercel.app`)
4. Your frontend is now live!

## Step 5: Configure Custom Domain (Optional)

1. Go to your Vercel project → **"Settings"** → **"Domains"**
2. Click **"Add"** and enter your custom domain (e.g., `labintel.com`)
3. Follow DNS configuration instructions provided by Vercel
4. Wait for DNS propagation (~24-48 hours)

## Step 6: Update Backend FRONTEND_URL

Once your Vercel frontend URL is live:

1. Go to your **Render backend dashboard**
2. Under **"Environment"**, update `FRONTEND_URL` to your Vercel URL
3. Redeploy the backend for the changes to take effect

## Step 7: Verify Deployment

1. Visit your Vercel URL in a browser
2. Check browser console for any errors
3. Test key features:
   - Sign in / sign up
   - Dashboard loading
   - API calls completing without CORS errors

## Redeploy on Code Changes

### Automatic Redeploy
- Any push to the `main` branch automatically triggers a redeploy
- Monitor progress in the Vercel dashboard

### Manual Redeploy
1. Go to Vercel project → **"Deployments"**
2. Click **"..."** on the latest deployment
3. Select **"Redeploy"**

## Troubleshooting

### Build Fails
- Check **Build Logs** in Vercel dashboard
- Ensure `frontend/package.json` exists
- Verify all dependencies are listed in `package.json`

### Environment Variables Not Showing
- Verify variables are prefixed with `VITE_`
- Redeploy after adding/updating variables
- Check browser console (not Node console)

### CORS Errors
- Update backend `FRONTEND_URL` to match your Vercel URL
- Ensure backend CORS configuration includes your Vercel domain

### 404 on Refresh
- This is expected for SPA (single-page apps)
- The `vercel.json` at repo root redirects all routes to `/index.html`
- Verify `vercel.json` exists at project root with correct config

## Resources

- [Vercel Docs](https://vercel.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Environment Variables in Vercel](https://vercel.com/docs/projects/environment-variables)
