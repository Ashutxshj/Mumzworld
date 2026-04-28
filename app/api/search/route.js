import { NextResponse } from "next/server";
import { heuristicParse, scoreProducts } from "../../../lib/search";

export async function POST(request) {
  try {
    const { query = "", language = "en" } = await request.json();
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return NextResponse.json({ mode: "fallback", parsed: heuristicParse(""), results: scoreProducts({ categories: [], keywords: [] }, language) });
    }

    let parsed;
    let mode = "fallback";
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "You are a product search assistant for Mumzworld, a baby and mother ecommerce platform in the Middle East. Given a user query in English or Arabic, extract intent, relevant categories, keywords, ageRange, priceRange, and language. Return ONLY valid JSON with keys: intent, categories, keywords, ageRange, priceRange, language."
            }]
          },
          contents: [{
            role: "user",
            parts: [{
              text: `Search query: "${cleanQuery}"\n\nReturn JSON only with: intent, categories, keywords, ageRange, priceRange, language`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        parsed = JSON.parse(raw);
        mode = "ai";
      } else {
        parsed = heuristicParse(cleanQuery);
      }
    } else {
      parsed = heuristicParse(cleanQuery);
    }

    const results = scoreProducts(parsed, language, mode);
    return NextResponse.json({ mode, parsed, results });
  } catch (error) {
    return NextResponse.json(
      { mode: "fallback", parsed: heuristicParse(""), results: [], error: error.message || "search_failed" },
      { status: 500 }
    );
  }
}
