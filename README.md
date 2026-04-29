# MumzVoice

MumzVoice is a Next.js prototype for Mumzworld that supports product search by text or voice in English and Arabic. It uses Gemini when available and falls back to local search logic when it is not.

## What it does
- Text and voice search
- English and Arabic support with RTL
- AI-assisted query understanding
- Fallback search without Gemini
- Demo catalog with product recommendations

## Stack
- Next.js
- React
- Web Speech API
- Gemini 2.5 Flash

## Run locally
Create a `.env` file in the project root:

```env
GEMINI_API_KEY=YOUR_KEY_HERE
```

Install and start:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Live demo
https://drive.google.com/file/d/1vjKTh6f5ll4oU-moGemlmE4bATEYOtZr/view?usp=sharing

## Notes
- Voice search depends on browser speech recognition support.
- If Gemini is unavailable, the app still returns results using local search rules.
- This uses a small demo catalog, not a live Mumzworld backend.
