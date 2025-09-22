# 🚀 Vercel Deployment Guide

## What will be deployed:
- ✅ AI Content Detector (`/detector`)
- ✅ Gemini Chat Interface (`/chat`)
- ✅ Landing page (`/`)
- ✅ API endpoints for AI features
- ❌ PHP blog functionality (requires separate hosting)

## Deployment Steps:

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from project directory
```bash
vercel
```

### 4. Configure Environment Variables
In your Vercel dashboard:
- Go to your project settings
- Add environment variable: `GEMINI_API_KEY` = `AIzaSyDTY3MC-PSAp8iwJbdwEKPSWA6Tu1XCwww`

### 5. Test your deployment
Your deployed URLs will be:
- Main site: `https://your-project.vercel.app/`
- AI Detector: `https://your-project.vercel.app/detector`
- Chat: `https://your-project.vercel.app/chat`

## Alternative: Deploy PHP Components

For the PHP blog functionality, consider these options:

### Option A: Convert to Node.js
- Replace PHP with Node.js/Express
- Use a cloud database (MongoDB Atlas, PlanetScale)
- Implement file upload with cloud storage

### Option B: Separate Hosting
- Deploy PHP components on traditional hosting (cPanel, Hostinger, etc.)
- Keep AI features on Vercel
- Link them together

### Option C: Full Stack Platform
- Use platforms like Railway, Render, or DigitalOcean App Platform
- These support both Node.js and databases

## Recommended Next Steps:
1. Deploy the AI features on Vercel first
2. Decide whether to convert PHP to Node.js or use separate hosting
3. Set up a proper database service for production

## Files that will be deployed:
- `landing.html` (main page)
- `detector/` (AI content detection)
- `chat/` (Gemini chat interface)
- `api/analyze.js` (content analysis API)
- `api/gemini-chat.js` (chat API)
- All static assets (CSS, JS, images)