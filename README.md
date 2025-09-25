# TruthLens

AI-powered tools for news detection and Gemini chat.

## Features
- Fake news detection
- Gemini AI chatbox
- Dark/light theme toggle
- Vercel Analytics integration
- Modern, responsive UI

## Getting Started

### 1. Clone the repository
```sh
git clone https://github.com/Prarthana-uv/my-blog-project.git
cd my-blog-project
```

### 2. Install dependencies
```sh
npm install
```

### 3. Set up environment variables
Create a `.env` file with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```
Add any other required keys (e.g., MongoDB, Cloudinary) if needed.

### 4. Run locally
```sh
vercel dev
```

### 5. Deploy to Vercel
- Push your code to GitHub
- Connect your repo to Vercel
- Set environment variables in Vercel dashboard
- Deploy!

## Usage
- Visit `/` for the landing page
- `/detector` for news detection
- `/chat` for Gemini chat

## Customization
- Edit `landing.html` and `styles/landing.css` for UI changes
- Update API endpoints in `api/`

## Analytics
- Vercel Analytics is enabled. View stats in your Vercel dashboard.

## License
MIT