# 🚀 Complete Vercel Deployment Guide

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
cd /Users/cody.born/repos/projects/skill_tree
git init
```

### 1.2 Create .gitignore (already exists)

Verify `.gitignore` includes:
```
node_modules
.next
.env
.env*.local
.vercel
```

### 1.3 Commit Your Code

```bash
# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Skill Tree Next.js migration complete"
```

### 1.4 Create GitHub Repository

**Option A: Using GitHub CLI (if installed)**
```bash
gh repo create skill-tree --public --source=. --remote=origin --push
```

**Option B: Using GitHub Web Interface**

1. Go to [GitHub](https://github.com/new)
2. Repository name: `skill-tree`
3. Description: "Interactive skill tree visualizer with AI generation"
4. Visibility: **Public** or **Private** (your choice)
5. **Do NOT** initialize with README (we already have one)
6. Click "Create repository"

7. Connect your local repo:
```bash
git remote add origin https://github.com/YOUR_USERNAME/skill-tree.git
git branch -M main
git push -u origin main
```

✅ **Checkpoint**: Your code should now be visible on GitHub

---

## Step 2: Set Up Vercel Account

### 2.1 Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your GitHub account
5. Complete the onboarding

✅ **Checkpoint**: You should be on the Vercel dashboard

---

## Step 3: Create Vercel Postgres Database

### 3.1 Create Database

1. In Vercel dashboard, click "Storage" in the top navigation
2. Click "Create Database"
3. Select "Postgres"
4. Database name: `skill-tree-db`
5. Region: Choose closest to your users (e.g., `us-east-1`, `eu-west-1`)
6. Click "Create"

⏳ Wait 1-2 minutes for database to provision

### 3.2 Get Database Connection String

1. Once created, click on your database name
2. Go to ".env.local" tab
3. You'll see several environment variables:
   ```
   POSTGRES_URL="..."
   POSTGRES_PRISMA_URL="..."
   POSTGRES_URL_NON_POOLING="..."
   ```
4. **Copy the `POSTGRES_PRISMA_URL`** - this is what we'll use

✅ **Checkpoint**: You have your database URL copied

---

## Step 4: Set Up Google OAuth for Production

### 4.1 Add Production Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you don't have it)
3. Navigate to: **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (or create new one)

5. Under "Authorized redirect URIs", add:
   ```
   https://skill-tree.vercel.app/api/auth/callback/google
   ```

   **Note**: Replace `skill-tree` with your actual Vercel project name
   (We'll get the exact URL in Step 6, but add this for now)

6. Click "Save"

✅ **Checkpoint**: Production callback URL added

---

## Step 5: Prepare Environment Variables

### 5.1 Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output (e.g., `dGhpcyBpcyBhIHNlY3JldCBrZXk=`)

### 5.2 Collect All Your Credentials

Create a temporary text file with all your environment variables:

```env
# Database (from Step 3.2)
DATABASE_URL="postgres://..."

# NextAuth (generate new one for production)
NEXTAUTH_SECRET="paste-the-output-from-openssl-command"
NEXTAUTH_URL="https://skill-tree.vercel.app"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"

# OpenAI (from OpenAI Platform)
OPENAI_API_KEY="sk-proj-..."
```

**⚠️ Security Note**:
- Use a **NEW** `NEXTAUTH_SECRET` for production (don't reuse local)
- Never commit this file to Git
- Delete after deployment

---

## Step 6: Deploy to Vercel

### 6.1 Import Project

1. In Vercel dashboard, click "Add New..." → "Project"
2. Find your `skill-tree` repository
3. Click "Import"

### 6.2 Configure Project

**Framework Preset**: Next.js (should auto-detect)

**Root Directory**: `./` (leave as default)

**Build Command**: `npm run build` (auto-filled)

**Output Directory**: `.next` (auto-filled)

**Install Command**: `npm install` (auto-filled)

### 6.3 Add Environment Variables

Click "Environment Variables" section and add each variable:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your Postgres URL | Production |
| `NEXTAUTH_SECRET` | Your generated secret | Production |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | Production |
| `GOOGLE_CLIENT_ID` | Your Google client ID | Production |
| `GOOGLE_CLIENT_SECRET` | Your Google secret | Production |
| `OPENAI_API_KEY` | Your OpenAI key | Production |

**Important**:
- Leave "Environments" as "Production" for all
- We'll update `NEXTAUTH_URL` with the actual URL after first deploy

### 6.4 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll see: ✅ "Congratulations! Your project has been successfully deployed"

### 6.5 Get Your Deployment URL

After deployment completes:
1. Click "Continue to Dashboard"
2. You'll see your deployment URL, e.g., `https://skill-tree-xyz123.vercel.app`
3. **Copy this URL**

✅ **Checkpoint**: Your app is deployed but may not work yet (we need to update URLs)

---

## Step 7: Update Production URLs

### 7.1 Update NEXTAUTH_URL in Vercel

1. In Vercel dashboard, go to your project
2. Click "Settings" tab
3. Click "Environment Variables"
4. Find `NEXTAUTH_URL`
5. Click the three dots → "Edit"
6. Update value to your actual deployment URL:
   ```
   https://skill-tree-xyz123.vercel.app
   ```
7. Click "Save"

### 7.2 Update Google OAuth Redirect URI

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Update the redirect URI to your actual URL:
   ```
   https://skill-tree-xyz123.vercel.app/api/auth/callback/google
   ```
5. Click "Save"

### 7.3 Redeploy

After updating environment variables, you need to redeploy:

1. In Vercel dashboard, go to "Deployments" tab
2. Click the three dots on the latest deployment → "Redeploy"
3. Select "Redeploy" (not "Redeploy with existing Build Cache")
4. Wait for redeployment to complete

✅ **Checkpoint**: URLs are now correct

---

## Step 8: Initialize Database Schema

Your database is empty - we need to create the tables.

### 8.1 Connect to Vercel Postgres Locally

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables (including database URL)
vercel env pull .env.production
```

### 8.2 Push Prisma Schema to Production Database

```bash
# Use the production database URL
DATABASE_URL=$(grep POSTGRES_PRISMA_URL .env.production | cut -d '=' -f2-) npx prisma db push
```

**Alternative Method (if above doesn't work)**:

1. Copy your `POSTGRES_PRISMA_URL` from Vercel dashboard
2. Run:
```bash
DATABASE_URL="paste-your-url-here" npx prisma db push
```

3. Confirm with `y` when prompted

You should see:
```
✔ Generated Prisma Client
✔ Database schema pushed successfully
```

✅ **Checkpoint**: Database tables created

---

## Step 9: Verify Deployment

### 9.1 Test Landing Page

1. Visit your deployment URL: `https://your-app.vercel.app`
2. You should see the landing page with "Skill Tree Visualizer"
3. No errors in browser console

✅ **Pass**: Landing page loads

### 9.2 Test Google OAuth

1. Click "Sign in with Google"
2. You should be redirected to Google's OAuth consent screen
3. Choose your Google account
4. Grant permissions
5. You should be redirected back to your app at `/tree/new`

✅ **Pass**: Authentication works

### 9.3 Test Database

After signing in:
1. Check Vercel Postgres dashboard → "Data" tab
2. You should see a new user in the `User` table
3. Also see records in `Account` and `Session` tables

✅ **Pass**: Database writes working

### 9.4 Test Skill Tree Editor

1. After sign-in, you should see the skill tree editor
2. The Cytoscape graph should load with a root node
3. Right-click should work (even if context menu isn't implemented yet)

✅ **Pass**: Editor loads

---

## Step 10: Set Up Custom Domain (Optional)

### 10.1 Add Custom Domain

If you want to use your own domain (e.g., `skilltree.yourdomain.com`):

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Click "Add"
3. Enter your domain: `skilltree.yourdomain.com`
4. Follow the instructions to add DNS records

### 10.2 Update OAuth Callback

After adding custom domain:

1. Update Google OAuth redirect URI to include your custom domain
2. Update `NEXTAUTH_URL` in Vercel environment variables
3. Redeploy

---

## Step 11: Set Up Production Monitoring

### 11.1 Enable Vercel Analytics

1. In Vercel dashboard, go to "Analytics" tab
2. Click "Enable Web Analytics"
3. Redeploy to activate

### 11.2 Set Up Error Tracking

Consider adding [Sentry](https://sentry.io) for error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Troubleshooting Common Issues

### Issue 1: Build Fails with Prisma Error

**Error**: `Prisma Client not found`

**Solution**:
1. Make sure `prisma generate` runs during build
2. Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```
3. Commit and push to trigger new deployment

### Issue 2: OAuth Redirect Mismatch

**Error**: "redirect_uri_mismatch" from Google

**Solution**:
1. Double-check the redirect URI in Google Cloud Console exactly matches:
   ```
   https://your-exact-url.vercel.app/api/auth/callback/google
   ```
2. No trailing slash
3. Must use HTTPS (not HTTP)
4. Domain must match exactly

### Issue 3: Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Verify `DATABASE_URL` in Vercel environment variables
2. Make sure you're using `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
3. Check Vercel Postgres dashboard to ensure database is running

### Issue 4: Environment Variables Not Working

**Error**: Variables are undefined

**Solution**:
1. Environment variables require a redeploy to take effect
2. After adding/changing variables, click "Redeploy" (not just refresh)
3. Make sure variables are set for "Production" environment

### Issue 5: NextAuth Session Error

**Error**: `[next-auth][error][SIGNIN_OAUTH_ERROR]`

**Solution**:
1. Generate a new `NEXTAUTH_SECRET` for production
2. Verify `NEXTAUTH_URL` matches your deployment URL exactly
3. Redeploy after changes

---

## Deployment Checklist

Use this checklist to verify everything is set up:

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] `.env.local` contains all required variables locally
- [ ] Local app runs successfully with `npm run dev`

### Vercel Setup
- [ ] Vercel account created
- [ ] Vercel Postgres database created
- [ ] Database URL obtained
- [ ] Project imported to Vercel
- [ ] All environment variables added
- [ ] First deployment completed

### Configuration
- [ ] `NEXTAUTH_URL` updated with actual deployment URL
- [ ] Google OAuth callback URL updated with production URL
- [ ] Redeployed after URL changes
- [ ] Prisma schema pushed to production database

### Testing
- [ ] Landing page loads without errors
- [ ] Google sign-in works
- [ ] User created in database
- [ ] Skill tree editor loads
- [ ] No console errors

### Optional
- [ ] Custom domain configured
- [ ] Analytics enabled
- [ ] Error tracking set up

---

## Ongoing Deployment Workflow

After initial setup, your workflow will be:

### For Code Changes

```bash
# 1. Make changes locally
# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push

# 4. Vercel automatically deploys!
```

Vercel will:
- Detect the push to GitHub
- Automatically build and deploy
- Give you a preview URL for testing
- Promote to production if everything passes

### For Environment Variable Changes

1. Update in Vercel dashboard → Settings → Environment Variables
2. Click "Redeploy" on latest deployment
3. Wait for redeployment to complete

---

## Next Steps After Deployment

Now that your app is deployed:

1. **Share the URL** with users for testing
2. **Connect the UI** to backend APIs (see NEXT_STEPS.md)
3. **Monitor logs** in Vercel dashboard for errors
4. **Set up alerts** for downtime or errors
5. **Consider upgrading** to Vercel Pro if you need:
   - Custom domains
   - Faster build times
   - Advanced analytics

---

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org

---

## Costs & Limits (Free Tier)

**Vercel Free Tier Includes**:
- 100 GB bandwidth/month
- Unlimited deployments
- 1 concurrent build
- 100 GB storage

**Vercel Postgres Free Tier**:
- 256 MB storage
- 60 hours compute time/month
- 256 MB data transfer/month

**Good for**: Personal projects, demos, MVPs, testing

**Upgrade when**: You exceed limits or need production features

---

## Success! 🎉

Your Skill Tree app is now live on Vercel with:
- ✅ Production database
- ✅ Google OAuth authentication
- ✅ AI generation capabilities
- ✅ Automatic deployments from GitHub
- ✅ HTTPS and custom domain support

**Your live URL**: https://your-project.vercel.app

---

**Questions?** Check the troubleshooting section above or review:
- NEXT_STEPS.md for feature implementation
- MIGRATION_COMPLETE.md for architecture overview
- README.md for local development setup
