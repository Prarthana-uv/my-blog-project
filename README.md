# My Blog Project

This repository contains two main components:

## 1. Main Blog (PHP + MySQL)
- **Files**: `index.php`, `blog_post_process.php`, `styles/`, `scripts/`, `media/`
- **Features**: Create and display blog posts with images
- **Deployment**: Use traditional web hosting (000WebHost, Hostinger, etc.)

## 2. Gemini Chat (JavaScript + Vercel)
- **Files**: `chat/` directory
- **Features**: AI-powered chat interface using Google Gemini
- **Deployment**: Vercel (already configured)

## Quick Start

### For the Main Blog:
1. Upload files to a PHP hosting service
2. Create MySQL database
3. Update database credentials in PHP files

### For the Gemini Chat:
1. Set `GEMINI_API_KEY` environment variable in Vercel
2. Deploy automatically via Vercel

## Project Structure
```
├── index.php              # Main blog page
├── blog_post_process.php  # Blog post handler
├── styles/               # CSS files
├── scripts/              # JavaScript files
├── media/                # Images
├── chat/                 # Gemini chat application
│   ├── index.html
│   ├── api/
│   └── styles/
└── vercel.json           # Vercel configuration
```