# Gemini Chat (PHP + Vanilla JS)

This folder contains a minimal chat UI wired to Google Gemini via a small PHP proxy.

## Setup

1) Create an API key in Google AI Studio. Enable Generative Language API for your project.

2) Provide your API key to the PHP proxy in one of these ways:

- Set an environment variable before starting the server:

  Windows PowerShell:
  ```powershell
  setx GEMINI_API_KEY "YOUR_KEY_HERE"
  ```

  macOS/Linux (bash/zsh):
  ```bash
  export GEMINI_API_KEY="YOUR_KEY_HERE"
  ```

- Or create a file `.env.local` in this directory containing:
  ```
  GEMINI_API_KEY=YOUR_KEY_HERE
  ```

## Run (built-in PHP server)

From the project root:

```bash
php -S localhost:8000 -t  GEMINI_API_KEY=YOUR_KEY blog/blog-using-php-mysql
```

Then open `http://localhost:8000/index.html` in your browser.

## Files

- `index.html` — Chat UI shell
- `styles/style.css` — Styles
- `scripts/script.js` — Frontend chat logic
- `gemini_chat.php` — PHP proxy to Google Gemini API
- `api/gemini-chat.js` — Vercel serverless function proxy for Gemini

## Deploy to Vercel

This project includes a Vercel serverless function so you can deploy without PHP.

1) Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2) In Vercel, "Add New Project" and import the repo. Set the project root to `blog/blog-using-php-mysql`.
3) In Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your key
4) Deploy.

Notes:
- The frontend auto-selects the endpoint. On Vercel domains (`*.vercel.app`), it calls `/api/gemini-chat`. Locally, it calls `gemini_chat.php`.
- You can remove `gemini_chat.php` when deploying to Vercel; it won’t be used there.

