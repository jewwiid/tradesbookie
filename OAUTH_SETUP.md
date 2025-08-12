# Google OAuth Setup Required - URGENT

## Current Status
✅ **OAuth Working**: Google authentication is functioning correctly
❌ **Missing URI**: Need to add redirect URI to Google Cloud Console

## IMMEDIATE ACTION REQUIRED

Google OAuth error shows this exact URI needs to be added:
```
https://3cc91570-fa8c-43bf-95a5-55159acf6009-00-1enanm0aay6nj.spock.replit.dev/api/callback
```

### 1. Add Redirect URI to Google Cloud Console
**Client ID**: `276784219000-dns7ns07aq97jo479v2rvv1ipen5odtd.apps.googleusercontent.com`

Add these URIs to your Google OAuth 2.0 Client:
```
https://tradesbook.ie/api/callback
https://3cc91570-fa8c-43bf-95a5-55159acf6009-00-1enanm0aay6nj.spock.replit.dev/api/callback
http://localhost:5000/api/callback
```

### 2. Google Cloud Console Steps
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID: `276784219000-dns7ns07aq97jo479v2rvv1ipen5odtd.apps.googleusercontent.com`
4. Click **Edit** 
5. Add the callback URLs above to **Authorized redirect URIs**
6. Save the configuration

### 3. Deploy Updated Code
After updating the Google OAuth settings, deploy your application to apply the changes to the production domain.

## Status
- ✅ Development environment: OAuth working correctly
- ⏳ Production deployment: Requires deployment + Google OAuth URI configuration
- ✅ Google credentials: Properly configured in environment variables

## Testing
Once deployed and configured, test the OAuth flow at: https://tradesbook.ie/api/login