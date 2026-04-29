# MumzVoice - AI Voice + Natural Language Search for Mumzworld

## Overview
MumzVoice is a Next.js prototype for Mumzworld that upgrades a standard ecommerce search bar into an AI-assisted bilingual discovery experience. It supports text and voice search, works in English and Arabic, and uses Gemini on the server to understand natural-language shopping intent.

The core product goal is simple: mothers often shop one-handed, often while multitasking, and often do not search with exact catalog keywords. This prototype turns everyday speech like `my baby just started solids` or `عربة اطفال للسفر` into ranked product results.

## What this project includes
- A responsive Mumzworld-inspired storefront UI
- Bilingual English / Arabic interface with RTL support
- Voice search with a full-screen listening overlay
- Live transcript display while the microphone is listening
- Automatic search after speech recognition completes
- Gemini-powered intent extraction through a Next.js API route
- Local fallback ranking when Gemini is unavailable
- Main search results plus a secondary `Other AI recommended products` section
- Hand-crafted 40-product demo catalog across baby and mother categories

## Stack
| Tool | Purpose |
|------|---------|
| Next.js App Router | Frontend + backend in one codebase |
| React | Client UI and interaction state |
| Web Speech API | Browser voice recognition |
| Gemini 2.5 Flash API | Intent extraction and query understanding |
| Local JS catalog | Demo search index and fallback ranking |

## Architecture
### Frontend
- [`app/page.js`](./app/page.js)
Renders the entire storefront UI, handles voice input, language switching, transcript display, and calling the search API.

- [`app/globals.css`](./app/globals.css)
Contains all branding, responsive layout, animation, listening overlay, and recommendation styles.

### Backend
- [`app/api/search/route.js`](./app/api/search/route.js)
Receives the user query, calls Gemini if an API key exists, falls back to heuristic parsing if needed, ranks products, and returns both primary results and extra recommendations.

### Shared logic
- [`lib/products.js`](./lib/products.js)
Bilingual 40-product hand-crafted catalog.

- [`lib/translations.js`](./lib/translations.js)
All UI strings for English and Arabic.

- [`lib/search.js`](./lib/search.js)
Shared tokenization, Arabic detection, heuristic parsing, fallback scoring, and recommendation logic.

## Search flow
1. The user types a query or taps the microphone.
2. If voice is used, the listening overlay opens and shows live transcript text as the user speaks.
3. When speech ends, the final transcript is inserted into the search bar.
4. The app automatically posts the query to `/api/search`.
5. The API route:
   - calls Gemini if `GEMINI_API_KEY` is available
   - falls back to local heuristics if Gemini fails or is missing
   - scores products against the extracted intent
   - returns top matches and additional recommendations
6. The UI renders:
   - ranked results
   - explanation badges
   - an `Other AI recommended products` section

## Voice UX behavior
- Uses `window.SpeechRecognition || window.webkitSpeechRecognition`
- Supports live transcript updates while listening
- Switches to Arabic search mode automatically if Arabic characters are detected
- Triggers search automatically on final transcript
- Shows a large full-screen listening state so the user knows the app is actively hearing them

## Multilingual support
- English and Arabic UI copy are stored centrally in `lib/translations.js`
- Switching language updates:
  - page direction
  - visible labels
  - button text
  - search hints
  - product names and descriptions
- Arabic input can be spoken or typed

## Gemini setup
Create a `.env` file in the project root:

```env
GEMINI_API_KEY=YOUR_FREE_GEMINI_API_KEY
```

Next.js reads this server-side. The key is not exposed directly to the browser.

## Run locally
1. Install dependencies:

```bash
npm install
```

2. Start development mode:

```bash
npm run dev
```

3. Open:

```text
http://localhost:3000
```

4. For production verification:

```bash
npm run build
npm run start
```

## Demo queries
- `my newborn needs a bed`
- `something for bath time`
- `travel stroller for newborn`
- `my baby just started solids`
- `عربة اطفال`
- `شيء لوقت الاستحمام`
- `سرير لحديث الولادة`

## Fallback behavior
If Gemini is unavailable, the app still works. It tokenizes the query, maps likely categories, scores products against English and Arabic tags, and returns ranked results without the model.

## Project notes
- `.env`, `.next`, and `node_modules` are ignored by git
- This is a prototype using a small local catalog, not a live Mumzworld backend
- Voice search reliability depends on Chrome-compatible Web Speech API support
- Product images are emoji placeholders by design for the take-home scope

## Why Next.js here
Next.js is the right fit for this version because the frontend and backend can live in one repo and one runtime:
- the client handles UI, speech, and rendering
- the server route handles Gemini securely
- no separate FastAPI service is required for this prototype

## Live demo
https://drive.google.com/file/d/1vjKTh6f5ll4oU-moGemlmE4bATEYOtZr/view?usp=sharing
