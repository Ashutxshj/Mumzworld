import { PRODUCTS } from "./products";

const CATEGORY_MAP = {
  gear: "Gear", stroller: "Gear", travel: "Gear", flight: "Gear", car: "Gear", carrier: "Gear",
  feeding: "Feeding", bottle: "Feeding", solids: "Feeding", weaning: "Feeding", milk: "Feeding", formula: "Feeding",
  diapers: "Diapers", diaper: "Diapers", wipes: "Diapers", nappy: "Diapers",
  toys: "Toys", toy: "Toys", teether: "Toys", sensory: "Toys",
  bedroom: "Bedroom", bed: "Bedroom", crib: "Bedroom", bassinet: "Bedroom", sleep: "Bedroom",
  fashion: "Fashion", clothes: "Fashion", onesie: "Fashion", shoes: "Fashion",
  bath: "Bath", wash: "Bath", soap: "Bath", tub: "Bath",
  safety: "Safety", monitor: "Safety", gate: "Safety", lock: "Safety",
  "عربة": "Gear", "سفر": "Gear", "مقعد": "Gear", "رضاعة": "Feeding", "حليب": "Feeding",
  "حفاض": "Diapers", "حفاضات": "Diapers", "مناديل": "Diapers", "لعبة": "Toys", "ألعاب": "Toys",
  "سرير": "Bedroom", "نوم": "Bedroom", "ملابس": "Fashion", "حذاء": "Fashion",
  "استحمام": "Bath", "حمام": "Bath", "أمان": "Safety", "سلامة": "Safety", "مراقبة": "Safety"
};

export function containsArabic(text = "") {
  return /[\u0600-\u06FF]/.test(text);
}

export function tokenize(text = "") {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
}

export function heuristicParse(query) {
  const tokens = tokenize(query);
  const lowered = query.toLowerCase();
  const categories = new Set();

  tokens.forEach((token) => {
    const mapped = CATEGORY_MAP[token];
    if (mapped) categories.add(mapped);
  });

  if (/solids|weaning|started solids|مهروس|فطام/.test(lowered)) categories.add("Feeding");
  if (/flight|travel|airport|plane|رحلة|طيران|سفر/.test(lowered)) categories.add("Gear");
  if (/bath|shower|استحمام|حمام/.test(lowered)) categories.add("Bath");
  if (/bed|sleep|crib|bassinet|سرير|نوم/.test(lowered)) categories.add("Bedroom");

  return {
    intent: query.trim(),
    categories: [...categories],
    keywords: tokens,
    ageRange: /newborn|0-6|حديث/.test(lowered) ? "newborn" : /3 month|6 month|toddler|3 أشهر|6 أشهر|طفل صغير/.test(lowered) ? "infant" : null,
    priceRange: /cheap|budget|affordable|اقتصادي|رخيص/.test(lowered) ? "budget" : null,
    language: containsArabic(query) ? "ar" : "en"
  };
}

export function scoreProducts(parsed, language = "en", mode = "fallback") {
  const keywords = [...new Set(parsed.keywords || [])];

  return PRODUCTS.map((product) => {
    let score = 0;
    const reasons = [];
    const fullText = `${product.name} ${product.nameAr} ${product.description} ${product.descriptionAr}`.toLowerCase();
    const tags = [...product.tags, ...product.tagsAr].map((tag) => tag.toLowerCase());

    if ((parsed.categories || []).includes(product.category)) {
      score += 5;
      reasons.push(mode === "ai" ? "AI matched category" : "Category keyword matched");
    }

    keywords.forEach((keyword) => {
      if (tags.some((tag) => tag.includes(keyword)) || fullText.includes(keyword)) {
        score += 2;
        reasons.push(language === "ar" ? `يطابق "${keyword}"` : `Matches "${keyword}"`);
      }
    });

    if (parsed.ageRange === "newborn" && /newborn|حديث الولادة|0-6/.test(fullText)) {
      score += 3;
      reasons.push(language === "ar" ? "مناسب لحديثي الولادة" : "Relevant for newborns");
    }

    if (parsed.ageRange === "infant" && /3 months|6 months|toddler|3 أشهر|6 أشهر|طفل صغير/.test(fullText)) {
      score += 2;
      reasons.push(language === "ar" ? "مناسب لهذه المرحلة" : "Fits this stage");
    }

    if (parsed.priceRange === "budget" && product.price < 100) {
      score += 2;
      reasons.push(language === "ar" ? "ضمن الميزانية" : "Budget-friendly");
    }

    score += product.rating / 5;

    return {
      ...product,
      score,
      matchReason: reasons.slice(0, 2).join(" · ") || (language === "ar" ? "مطابقة عامة للبحث" : "General relevance match")
    };
  })
    .filter((product) => product.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
