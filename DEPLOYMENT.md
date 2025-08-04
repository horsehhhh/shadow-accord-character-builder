# Shadow Accord Character Builder - Deployment Guide

## Pre-Deployment Setup

### 1. MongoDB Atlas Setup
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/shadow-accord`
4. Whitelist all IPs (0.0.0.0/0) for production

### 2. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Railway Deployment (Recommended)

### Backend Deployment
1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Click "Deploy Now"
5. Go to Settings → Environment Variables:
   - `MONGODB_URI`: (your MongoDB Atlas connection string)
   - `JWT_SECRET`: (generate random 32+ character string)
   - `NODE_ENV`: production
6. Go to Settings → Service:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
7. Copy the backend URL (like `https://your-backend.railway.app`)

### Frontend Deployment
1. Add new service in same Railway project
2. Select same GitHub repo
3. Environment Variables:
   - `REACT_APP_API_URL`: `https://your-backend.railway.app/api`
4. Settings → Service:
   - Root Directory: `.` (leave empty)
   - Build Command: `npm run build`
   - Start Command: `npx serve -s build -p $PORT`

## Alternative: Vercel + Railway

### Backend: Railway (same as above)

### Frontend: Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Build settings:
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Environment Variables:
   - `REACT_APP_API_URL`: (your Railway backend URL)

## Testing Deployment
1. Visit your deployed frontend URL
2. Register a new account
3. Create a character
4. Open incognito window
5. Login with same account → Character should appear!

## Custom Domain (Optional)
- Railway: Add custom domain in service settings
- Vercel: Add domain in project settings
- Update CORS in backend to include your domain

## Troubleshooting
- Check Railway logs for backend errors
- Verify environment variables are set correctly
- Ensure MongoDB Atlas allows connections
- Check CORS settings if cross-origin errors occur
