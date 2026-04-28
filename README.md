# MumzVoice — Next.js Voice Search for Mumzworld

## What changed
The prototype is now structured as a proper Next.js app instead of a single static HTML file. The frontend and backend live in one project:

- `app/page.js` renders the UI
- `app/api/search/route.js` handles Gemini intent extraction on the server
- `.env` is read by Next.js on the server, not exposed to the browser

This removes the brittle client-side key handling and makes the microphone + search flow easier to extend.

## Problem
Mumzworld has a massive catalog, but keyword-only search is weak for one-handed shopping and for Arabic natural-language queries.

## Solution
MumzVoice adds:

- Voice input with Web Speech API
- English + Arabic UI with RTL support
- Gemini-powered intent extraction through a server route
- Smart fallback ranking against a curated 40-product catalog
- A full-screen listening overlay so the voice interaction feels explicit

## Tech Stack
| Tool | Purpose | Cost |
|------|---------|------|
| Next.js | Frontend + backend in one app | Free |
| Web Speech API | Voice recognition | Free |
| Gemini 2.5 Flash API | Intent extraction | Free tier |
| Hand-crafted catalog | Demo product data | Free |

## How to Run
1. Keep your key in `.env`:

```env
GEMINI_API_KEY=YOUR_FREE_GEMINI_API_KEY
```

2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Notes
- `.gitignore` excludes `.env`, `node_modules`, and `.next`
- If Gemini is unavailable, the app falls back to local ranking
- Voice recognition still depends on Chrome-compatible Web Speech support
