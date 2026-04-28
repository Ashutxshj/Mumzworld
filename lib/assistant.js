import { PRODUCTS } from "./products";
import { heuristicParse, scoreProducts } from "./search";

function getProductById(id) {
  return PRODUCTS.find((product) => product.id === id);
}

function option(label, value, type = "refine") {
  return { label, value, type };
}

function searchOption(label, value = label) {
  return option(label, value, "search");
}

function buildSleepFlow(language) {
  return {
    reply: language === "ar"
      ? "مشاكل النوم غالباً ترتبط ببيئة النوم أو الروتين أو التهدئة. لا أقدم نصيحة طبية، لكن يمكنني تضييق المنتجات المناسبة لك."
      : "Sleep problems often connect to sleep setup, routine, or calming support. I cannot give medical advice, but I can narrow down the most relevant products.",
    followUpQuestion: language === "ar"
      ? "أي اتجاه تريدين أن نبدأ به؟"
      : "Which direction do you want to explore first?",
    options: language === "ar"
      ? [
          option("سرير", "crib"),
          option("سرير جانبي", "bassinet"),
          option("لفافة", "swaddle"),
          option("جهاز مراقبة", "monitor")
        ]
      : [
          option("Crib", "crib"),
          option("Bassinet", "bassinet"),
          option("Swaddle", "swaddle"),
          option("Monitor", "monitor")
        ]
  };
}

function buildCribFlow(language) {
  return {
    reply: language === "ar"
      ? "ممتاز. بالنسبة للنوم، هذه أقرب أنواع الأسرّة التي يمكن أن تناسب الوصف."
      : "Good direction. For sleep, these are the closest crib-style products for that need.",
    followUpQuestion: language === "ar"
      ? "اختاري النوع الذي تريدين البحث عنه الآن."
      : "Choose the type you want me to search now.",
    options: language === "ar"
      ? [
          searchOption("سرير لحديث الولادة", "Stokke Sleepi Mini Crib"),
          searchOption("سرير جانبي للرضعات الليلية", "Graco DreamMore Bassinet"),
          searchOption("سرير سفر للنوم خارج المنزل", "Graco Pack 'n Play Travel Cot")
        ]
      : [
          searchOption("Newborn crib", "Stokke Sleepi Mini Crib"),
          searchOption("Bedside bassinet", "Graco DreamMore Bassinet"),
          searchOption("Travel cot", "Graco Pack 'n Play Travel Cot")
        ]
  };
}

function buildSwaddleFlow(language) {
  return {
    reply: language === "ar"
      ? "إذا كان الهدف تهدئة الطفل قبل النوم، يمكن البدء بمنتجات اللف والنوم الهادئ."
      : "If the goal is calming before sleep, swaddle and bedtime comfort products are a good first direction.",
    followUpQuestion: language === "ar"
      ? "اختاري ما تريدين البحث عنه."
      : "Choose what you want me to search.",
    options: language === "ar"
      ? [
          searchOption("لفافات موسلين للنوم", "Aden + Anais Swaddle 3 Pack"),
          searchOption("منتجات نوم لحديث الولادة", "newborn sleep essentials")
        ]
      : [
          searchOption("Muslin swaddles", "Aden + Anais Swaddle 3 Pack"),
          searchOption("Newborn sleep essentials", "newborn sleep essentials")
        ]
  };
}

function buildMonitorFlow(language) {
  return {
    reply: language === "ar"
      ? "إذا كنت تريدين متابعة الطفل أثناء النوم، يمكننا تضييق البحث إلى أجهزة المراقبة."
      : "If you want better visibility during sleep, we can narrow this to monitors.",
    followUpQuestion: language === "ar"
      ? "أي نوع تفضلين؟"
      : "Which type do you prefer?",
    options: language === "ar"
      ? [
          searchOption("مراقبة فيديو", "VTech Video Baby Monitor"),
          searchOption("مراقبة صوتية", "VTech Audio Baby Monitor")
        ]
      : [
          searchOption("Video monitor", "VTech Video Baby Monitor"),
          searchOption("Audio monitor", "VTech Audio Baby Monitor")
        ]
  };
}

function buildFeedingFlow(language) {
  return {
    reply: language === "ar"
      ? "هذا يبدو قريباً من الرضاعة أو بداية الأكل الصلب."
      : "This sounds related to feeding or starting solids.",
    followUpQuestion: language === "ar"
      ? "ما الذي تريدين التركيز عليه؟"
      : "What do you want to focus on?",
    options: language === "ar"
      ? [
          option("رضاعات", "bottles"),
          option("كرسي طعام", "high-chair"),
          option("حليب أو تركيبة", "formula"),
          option("تحضير مهروس", "puree")
        ]
      : [
          option("Bottles", "bottles"),
          option("High chair", "high-chair"),
          option("Formula", "formula"),
          option("Puree prep", "puree")
        ]
  };
}

function buildBathFlow(language) {
  return {
    reply: language === "ar"
      ? "هذا يبدو مرتبطاً بالاستحمام أو العناية بالبشرة."
      : "This sounds related to bath time or skin care.",
    followUpQuestion: language === "ar"
      ? "أي نوع من المنتجات تريدين؟"
      : "Which product type do you want?",
    options: language === "ar"
      ? [
          searchOption("حوض استحمام للطفل", "Skip Hop Moby Baby Tub"),
          searchOption("غسول لطيف", "Mustela Gentle Cleansing Gel"),
          searchOption("كريم لمنطقة الحفاض", "Mustela Nappy Change Cream")
        ]
      : [
          searchOption("Baby tub", "Skip Hop Moby Baby Tub"),
          searchOption("Gentle cleansing gel", "Mustela Gentle Cleansing Gel"),
          searchOption("Nappy change cream", "Mustela Nappy Change Cream")
        ]
  };
}

function buildTravelFlow(language) {
  return {
    reply: language === "ar"
      ? "للسفر أو الخروج، يمكننا تضييق البحث حسب نوع التنقل."
      : "For travel or getting around, we can narrow this by travel type.",
    followUpQuestion: language === "ar"
      ? "ما الذي تريدين البحث عنه؟"
      : "What do you want to search for?",
    options: language === "ar"
      ? [
          searchOption("عربة سفر خفيفة", "Joie Pact Pro Compact Stroller"),
          searchOption("حمالة للرحلات", "BabyBjorn Mini Carrier"),
          searchOption("نظام سفر كامل", "Chicco Bravo Travel System")
        ]
      : [
          searchOption("Compact travel stroller", "Joie Pact Pro Compact Stroller"),
          searchOption("Travel carrier", "BabyBjorn Mini Carrier"),
          searchOption("Full travel system", "Chicco Bravo Travel System")
        ]
  };
}

function buildFeedingSubtypeFlow(key, language) {
  const map = {
    bottles: language === "ar"
      ? { reply: "سأركز على الرضاعات المناسبة.", followUpQuestion: "اختاري البحث الآن.", options: [searchOption("طقم رضاعات لحديثي الولادة", "Philips Avent Natural Bottle Set")] }
      : { reply: "I will focus on bottle feeding options.", followUpQuestion: "Choose the one to search now.", options: [searchOption("Newborn bottle set", "Philips Avent Natural Bottle Set")] },
    "high-chair": language === "ar"
      ? { reply: "هذا مناسب لبداية الأكل الصلب.", followUpQuestion: "اختاري البحث الآن.", options: [searchOption("كرسي طعام للأطفال", "Chicco Polly High Chair")] }
      : { reply: "This is a good direction for solids.", followUpQuestion: "Choose the one to search now.", options: [searchOption("Baby high chair", "Chicco Polly High Chair")] },
    formula: language === "ar"
      ? { reply: "سأركز على خيارات الحليب أو التركيبة.", followUpQuestion: "اختاري البحث الآن.", options: [searchOption("تركيبة للمرحلة الأولى", "Aptamil Stage 1 Formula")] }
      : { reply: "I will focus on milk or formula options.", followUpQuestion: "Choose the one to search now.", options: [searchOption("Stage 1 formula", "Aptamil Stage 1 Formula")] },
    puree: language === "ar"
      ? { reply: "هذا مناسب لتحضير الأكل الصلب في المنزل.", followUpQuestion: "اختاري البحث الآن.", options: [searchOption("جهاز تحضير مهروس", "Philips Avent Steamer Blender")] }
      : { reply: "This fits homemade solid-food prep.", followUpQuestion: "Choose the one to search now.", options: [searchOption("Puree maker", "Philips Avent Steamer Blender")] }
  };
  return map[key] || null;
}

function resolveFlow(message, language = "en") {
  const lowered = message.toLowerCase();

  if (/crib|سرير/.test(lowered)) return buildCribFlow(language);
  if (/bassinet|سرير جانبي/.test(lowered)) return buildCribFlow(language);
  if (/swaddle|لفافة|لفة/.test(lowered)) return buildSwaddleFlow(language);
  if (/monitor|مراقبة/.test(lowered)) return buildMonitorFlow(language);
  if (/sleep|nap|bedtime|نوم/.test(lowered)) return buildSleepFlow(language);
  if (/bottles|bottle|رضاعة/.test(lowered)) return buildFeedingSubtypeFlow("bottles", language);
  if (/high chair|كرسي/.test(lowered)) return buildFeedingSubtypeFlow("high-chair", language);
  if (/formula|تركيبة|حليب/.test(lowered)) return buildFeedingSubtypeFlow("formula", language);
  if (/puree|مهروس/.test(lowered)) return buildFeedingSubtypeFlow("puree", language);
  if (/feeding|solids|weaning|فطام|تغذية/.test(lowered)) return buildFeedingFlow(language);
  if (/bath|rash|skin|استحمام|طفح|بشرة/.test(lowered)) return buildBathFlow(language);
  if (/travel|flight|stroller|carrier|سفر|عربة|رحلة/.test(lowered)) return buildTravelFlow(language);

  return {
    reply: language === "ar"
      ? "فهمت الوصف. يمكنني تضييق هذا إلى اتجاهات تسوق واضحة."
      : "Understood. I can turn that into a few clear shopping directions.",
    followUpQuestion: language === "ar"
      ? "اختاري الاتجاه الأقرب لما تريدينه."
      : "Choose the direction closest to what you need.",
    options: language === "ar"
      ? [
          option("النوم", "sleep"),
          option("الرضاعة", "feeding"),
          option("التنقل", "travel"),
          option("الاستحمام", "bath")
        ]
      : [
          option("Sleep", "sleep"),
          option("Feeding", "feeding"),
          option("Travel", "travel"),
          option("Bath", "bath")
        ]
  };
}

export function buildAssistantFallback(message, language = "en") {
  const parsed = heuristicParse(message);
  const searchResults = scoreProducts(parsed, language, "fallback");
  const flow = resolveFlow(message, language);
  const recommendedProducts = searchResults.slice(0, 3).map((product) => ({
    id: product.id,
    name: language === "ar" ? product.nameAr : product.name,
    reason: product.matchReason
  }));

  const suggestedSearches = flow.options
    .filter((item) => item.type === "search")
    .map((item) => item.value)
    .slice(0, 3);

  return {
    reply: flow.reply,
    followUpQuestion: flow.followUpQuestion,
    options: flow.options,
    suggestedSearches,
    recommendedProducts,
    searchResults
  };
}

export function mapAssistantProductIds(ids = [], language = "en") {
  return ids
    .map((id) => getProductById(id))
    .filter(Boolean)
    .map((product) => ({
      id: product.id,
      name: language === "ar" ? product.nameAr : product.name,
      reason: language === "ar" ? product.descriptionAr : product.description
    }));
}
