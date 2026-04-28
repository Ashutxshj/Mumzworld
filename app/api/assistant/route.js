import { NextResponse } from "next/server";
import { buildAssistantFallback, mapAssistantProductIds } from "../../../lib/assistant";

export async function POST(request) {
  try {
    const { message = "", language = "en", history = [] } = await request.json();
    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return NextResponse.json({
        reply: language === "ar" ? "احكي لي باختصار ما الذي يزعجك أو ما الذي تبحثين عنه." : "Tell me briefly what problem you are trying to solve or what you need.",
        followUpQuestion: language === "ar" ? "هل تريدين أن نبدأ بالنوم أم التغذية أم التنقل؟" : "Do you want to start with sleep, feeding, or travel?",
        options: [],
        suggestedSearches: [],
        recommendedProducts: []
      });
    }

    const fallback = buildAssistantFallback(cleanMessage, language);
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(fallback);
    }

    const conversation = history
      .slice(-6)
      .map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.text}`)
      .join("\n");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: "You are MumzVoice, a shopping assistant for Mumzworld. The user may describe a parenting problem rather than a product. Respond like a helpful ecommerce assistant, not a doctor. Give a short empathetic explanation and ask one practical follow-up question. Return ONLY valid JSON: { reply: string, followUpQuestion: string, recommendedProductIds: string[] }"
          }]
        },
        contents: [{
          role: "user",
          parts: [{
            text: `Language: ${language}\nCatalog product ids: gear-1, gear-2, gear-3, gear-4, gear-5, feeding-1, feeding-2, feeding-3, feeding-4, feeding-5, diapers-1, diapers-2, diapers-3, diapers-4, diapers-5, toys-1, toys-2, toys-3, toys-4, toys-5, bedroom-1, bedroom-2, bedroom-3, bedroom-4, bedroom-5, fashion-1, fashion-2, fashion-3, fashion-4, fashion-5, bath-1, bath-2, bath-3, bath-4, bath-5, safety-1, safety-2, safety-3, safety-4, safety-5\nConversation so far:\n${conversation}\nUser message: ${cleanMessage}`
          }]
        }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      reply: parsed.reply || fallback.reply,
      followUpQuestion: parsed.followUpQuestion || fallback.followUpQuestion,
      options: fallback.options,
      suggestedSearches: fallback.suggestedSearches,
      recommendedProducts: mapAssistantProductIds(parsed.recommendedProductIds || [], language).length
        ? mapAssistantProductIds(parsed.recommendedProductIds || [], language)
        : fallback.recommendedProducts
    });
  } catch (error) {
    return NextResponse.json(buildAssistantFallback("", "en"), { status: 500 });
  }
}
