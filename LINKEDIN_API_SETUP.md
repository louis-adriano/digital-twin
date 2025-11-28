# LinkedIn API Setup Guide

## Step 1: Create LinkedIn Developer App

1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill in:
   - App name: "Digital Twin Portfolio"
   - LinkedIn Page: (Select your company page or create one)
   - Privacy policy URL: Your website URL
   - App logo: Upload any image
4. Click "Create app"

## Step 2: Get API Credentials

1. In your app dashboard, go to "Auth" tab
2. Copy these credentials:
   - Client ID
   - Client Secret
3. Add redirect URL: `http://localhost:3000/api/auth/linkedin/callback`
4. Also add: `https://your-domain.vercel.app/api/auth/linkedin/callback`

## Step 3: Request API Products

1. In your app, go to "Products" tab
2. Request access to:
   - **"Share on LinkedIn"** - Required for reading posts
   - **"Sign In with LinkedIn using OpenID Connect"** - Required for auth
3. LinkedIn will review your request (can take 1-2 weeks)

⚠️ **IMPORTANT LIMITATION:**
LinkedIn's API only allows you to read YOUR OWN posts after OAuth authentication.
You CANNOT read public posts without the user being logged in.

## Step 4: Add Environment Variables

Once approved, add to `.env.local`:

```
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
```

## Alternative: Use Manual Entry Instead

Given LinkedIn's API limitations (approval time, OAuth requirement, rate limits),
I recommend using the manual admin panel approach instead.

Would you like to:
1. Wait for LinkedIn API approval (1-2 weeks) and implement full OAuth flow
2. Switch to manual admin panel (ready in 10 minutes)
