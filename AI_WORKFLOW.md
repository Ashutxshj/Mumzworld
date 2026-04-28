# AI Workflow

## Tools Used
- Claude and Gemini were used to draft realistic baby and mother ecommerce products.
- Claude and Gemini were used to generate Arabic product names, descriptions, and UI labels.
- Claude and Gemini were used to refine the natural-language intent extraction prompt.
- Claude and Gemini were used to reason about RTL layout edge cases and voice-search UX.
- Claude Code was used to scaffold, implement, and document the full prototype in this repo.

## What AI Helped Produce
- 40 bilingual catalog entries across gear, feeding, diapers, toys, bedroom, fashion, bath, and safety
- English and Arabic interface copy
- Search prompt structure for extracting `intent`, `categories`, `keywords`, `ageRange`, `priceRange`, and `language`
- Fallback keyword ranking approach and result explanation copy

## Engineering Decisions
- The app is static and opens directly in Chrome without npm or a build step.
- Gemini is optional and driven by `config.js`; no secret is committed.
- Smart fallback search guarantees the prototype still works offline except for optional live AI calls.
- Web Speech API is used for zero-cost browser-native voice recognition in English and Arabic.
