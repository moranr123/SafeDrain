# Safe Drain Deployment Guide

This guide will help you deploy the Safe Drain application to production.

## Prerequisites

1. Ensure your `.env` file has all required environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_VAPID_KEY`
   - `VITE_GOOGLE_MAPS_API_KEY`

2. Build the project:
   ```bash
   npm run build
   ```

## Option 1: Deploy to Firebase Hosting (Recommended)

Since you're already using Firebase, Firebase Hosting is the easiest option.

### Steps:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting** (if not already initialized):
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to: `dist`
   - Configure as single-page app: `Yes`
   - Set up automatic builds: `No`

4. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

5. Your app will be live at: `https://YOUR-PROJECT-ID.web.app`

## Option 2: Deploy to Vercel

Vercel is excellent for React/Vite applications and provides automatic deployments.

### Steps:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Add your environment variables when prompted

3. **For production deployment**:
   ```bash
   vercel --prod
   ```

4. Your app will be live at: `https://YOUR-PROJECT.vercel.app`

### Environment Variables in Vercel:

After deploying, add your environment variables in the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all variables from your `.env` file (without the `VITE_` prefix is handled automatically)

## Option 3: Deploy to Netlify

### Steps:

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod --dir=dist
   ```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test authentication (login/signup)
- [ ] Test Firebase Firestore operations
- [ ] Test file uploads (Storage)
- [ ] Test Google Maps integration
- [ ] Test notifications (FCM)
- [ ] Verify admin and user role separation
- [ ] Test on mobile devices
- [ ] Check browser console for errors

## Important Notes

1. **Environment Variables**: Make sure all environment variables are set in your hosting platform's dashboard
2. **Firebase Rules**: Ensure your Firestore Security Rules are properly configured for production
3. **CORS**: If using external APIs, ensure CORS is configured correctly
4. **Service Worker**: The FCM service worker should be accessible at `/firebase-messaging-sw.js`

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check for TypeScript/ESLint errors: `npm run lint`

### Runtime Errors
- Check browser console for errors
- Verify environment variables are set correctly
- Check Firebase configuration

### Firebase Hosting Issues
- Ensure `firebase.json` is configured correctly
- Check that `dist` folder exists after build
- Verify Firebase project is linked: `firebase projects:list`

