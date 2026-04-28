(function () {
  const DEFAULT_STATE = {
    language: "en",
    query: "",
    lastMode: "fallback",
    listening: false,
    loading: false
  };

  const state = { ...DEFAULT_STATE };
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const categoryMap = {
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

  const els = {
    body: document.body,
    html: document.documentElement,
    announcementList: document.getElementById("announcementList"),
    languageToggle: document.getElementById("languageToggle"),
    deliverTo: document.getElementById("deliverTo"),
    signIn: document.getElementById("signInBtn"),
    searchInput: document.getElementById("searchInput"),
    searchButton: document.getElementById("searchButton"),
    micButton: document.getElementById("micButton"),
    statusPill: document.getElementById("statusPill"),
    statusText: document.getElementById("statusText"),
    searchHint: document.getElementById("searchHint"),
    heroEyebrow: document.getElementById("heroEyebrow"),
    heroTitle: document.getElementById("heroTitle"),
    heroText: document.getElementById("heroText"),
    heroBadge: document.getElementById("heroBadge"),
    resultsTitle: document.getElementById("resultsTitle"),
    resultsSummary: document.getElementById("resultsSummary"),
    resultsTag: document.getElementById("resultsTag"),
    resultsGrid: document.getElementById("resultsGrid"),
    emptyState: document.getElementById("emptyState"),
    emptyTitle: document.getElementById("emptyTitle"),
    emptyText: document.getElementById("emptyText"),
    footerNote: document.getElementById("footerNote"),
    navPills: Array.from(document.querySelectorAll("[data-nav-key]")),
    heroMetrics: Array.from(document.querySelectorAll("[data-metric]"))
  };

  let recognition = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => showStatus(t().voiceError, true);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
      if (!transcript) return;
      if (containsArabic(transcript) && state.language !== "ar") toggleLanguage("ar");
      state.query = transcript;
      els.searchInput.value = transcript;
      runSearch(transcript);
    };
  }

  function t() {
    return TRANSLATIONS[state.language];
  }

  function containsArabic(text) {
    return /[\u0600-\u06FF]/.test(text);
  }

  function getUiCategory(category) {
    return state.language === "ar"
      ? PRODUCTS.find((p) => p.category === category)?.categoryAr || category
      : category;
  }

  function renderStaticText() {
    const copy = t();
    els.html.lang = copy.htmlLang;
    els.html.dir = copy.dir;
    els.body.classList.add("lang-fade");
    setTimeout(() => els.body.classList.remove("lang-fade"), 180);
    els.announcementList.innerHTML = copy.announcement.map((item) => `<span class="announcement-item">${item}</span>`).join("");
    els.languageToggle.textContent = copy.languageSwitch;
    els.languageToggle.setAttribute("aria-label", copy.toggleAria);
    els.deliverTo.textContent = copy.deliverTo;
    els.signIn.textContent = copy.signIn;
    els.searchInput.placeholder = copy.searchPlaceholder;
    els.searchButton.textContent = copy.searchButton;
    els.micButton.setAttribute("aria-label", copy.micLabel);
    els.searchHint.textContent = state.loading ? copy.aiLoading : copy.searchHint;
    els.heroEyebrow.textContent = copy.heroEyebrow;
    els.heroTitle.textContent = copy.heroTitle;
    els.heroText.textContent = copy.heroText;
    els.heroBadge.textContent = copy.heroBadge;
    els.resultsTitle.textContent = copy.resultsTitle;
    els.emptyTitle.textContent = copy.emptyTitle;
    els.emptyText.textContent = copy.emptyText;
    els.footerNote.textContent = copy.footer;
    els.navPills.forEach((pill) => {
      pill.textContent = copy.categories[pill.dataset.navKey] || pill.dataset.navKey;
    });
    const metrics = state.language === "ar"
      ? [["40", "منتجاً تجريبياً"], ["EN / AR", "بحث ثنائي اللغة"], ["Voice", "إدخال صوتي"], ["Offline", "بحث احتياطي"]]
      : [["40", "prototype products"], ["EN / AR", "bilingual search"], ["Voice", "speech input"], ["Offline", "fallback ready"]];
    els.heroMetrics.forEach((metric, i) => {
      metric.innerHTML = `<strong>${metrics[i][0]}</strong><span>${metrics[i][1]}</span>`;
    });
    if (recognition) recognition.lang = copy.locale;
    showStatus(state.listening ? copy.listening : "", false);
  }

  function setListening(listening) {
    state.listening = listening;
    els.micButton.classList.toggle("listening", listening);
    showStatus(listening ? t().listening : "", false);
  }

  function showStatus(message, sticky) {
    els.statusText.textContent = message;
    els.statusPill.classList.toggle("visible", Boolean(message));
    if (message && !sticky && !state.listening) {
      clearTimeout(showStatus.timer);
      showStatus.timer = setTimeout(() => els.statusPill.classList.remove("visible"), 1800);
    }
  }

  function renderProducts(products, summary, mode) {
    els.resultsSummary.textContent = summary;
    els.resultsTag.textContent = mode === "ai" ? t().aiLabel : t().fallbackLabel;
    els.resultsGrid.innerHTML = products.map((product, index) => {
      const name = state.language === "ar" ? product.nameAr : product.name;
      const category = state.language === "ar" ? product.categoryAr : product.category;
      return `
        <article class="card" style="animation-delay:${index * 60}ms">
          <div class="card-top">${product.emoji}</div>
          <div class="card-body">
            <div class="brand">${product.brand}</div>
            <h3>${name}</h3>
            <div class="price">AED ${product.price}</div>
            <span class="category-badge">${category}</span>
            <p class="reason">${product.matchReason || ""}</p>
            <div class="card-actions">
              <button class="add-btn">${t().addToCart}</button>
              <span class="rating">★ ${product.rating.toFixed(1)}</span>
            </div>
          </div>
        </article>`;
    }).join("");
    els.emptyState.hidden = products.length > 0;
    els.resultsGrid.hidden = products.length === 0;
  }

  function tokenize(text) {
    return (text || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  }

  function heuristicParse(query) {
    const tokens = tokenize(query);
    const categories = new Set();
    tokens.forEach((token) => {
      const mapped = categoryMap[token];
      if (mapped) categories.add(mapped);
    });
    const lowered = query.toLowerCase();
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

  function scoreProducts(parsed, useAiLabel) {
    const keywords = [...new Set(parsed.keywords || [])];
    return PRODUCTS.map((product) => {
      let score = 0;
      const reasons = [];
      const productName = `${product.name} ${product.nameAr} ${product.description} ${product.descriptionAr}`.toLowerCase();
      const tags = [...product.tags, ...product.tagsAr].map((tag) => tag.toLowerCase());
      if (parsed.categories.includes(product.category)) {
        score += 5;
        reasons.push(useAiLabel ? "AI matched category" : "Category keyword matched");
      }
      keywords.forEach((keyword) => {
        if (tags.some((tag) => tag.includes(keyword)) || productName.includes(keyword)) {
          score += 2;
          reasons.push(state.language === "ar" ? `يطابق "${keyword}"` : `Matches "${keyword}"`);
        }
      });
      if (parsed.ageRange === "newborn" && /newborn|حديث الولادة|0-6/.test(productName)) {
        score += 3;
        reasons.push(state.language === "ar" ? "مناسب لحديثي الولادة" : "Relevant for newborns");
      }
      if (parsed.ageRange === "infant" && /3 months|6 months|toddler|3 أشهر|6 أشهر|طفل صغير/.test(productName)) {
        score += 2;
        reasons.push(state.language === "ar" ? "مناسب لهذه المرحلة" : "Fits this stage");
      }
      if (parsed.priceRange === "budget" && product.price < 100) {
        score += 2;
        reasons.push(state.language === "ar" ? "ضمن الميزانية" : "Budget-friendly");
      }
      score += product.rating / 5;
      return {
        ...product,
        score,
        matchReason: reasons.slice(0, 2).join(" · ") || (state.language === "ar" ? "مطابقة عامة للبحث" : "General relevance match")
      };
    }).filter((product) => product.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  async function callGemini(query) {
    await (window.APP_CONFIG_READY || Promise.resolve());
    const apiKey = window.APP_CONFIG?.geminiApiKey;
    if (!apiKey) throw new Error("missing-key");
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
            text: `Search query: "${query}"\n\nReturn JSON only with: intent, categories, keywords, ageRange, priceRange, language`
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });
    if (!response.ok) throw new Error(`gemini-${response.status}`);
    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(raw);
  }

  async function runSearch(rawQuery) {
    const query = rawQuery.trim();
    state.query = query;
    if (!query) {
      renderProducts(PRODUCTS.slice(0, 8).map((p) => ({ ...p, matchReason: state.language === "ar" ? "منتج مميز في الكتالوج" : "Featured catalog product" })), t().aiReady, "fallback");
      return;
    }
    state.loading = true;
    renderStaticText();
    els.resultsSummary.innerHTML = `<span class="loading"><span></span><span></span><span></span></span>`;
    let parsed;
    let mode = "fallback";
    try {
      parsed = await callGemini(query);
      mode = "ai";
    } catch (error) {
      parsed = heuristicParse(query);
      showStatus(error.message === "missing-key" ? t().aiOffline : t().voiceError, false);
    }
    const results = scoreProducts(parsed, mode === "ai");
    const intentText = state.language === "ar"
      ? `عرض النتائج لـ: ${parsed.intent || query}`
      : `Showing results for: ${parsed.intent || query}`;
    renderProducts(results, intentText, mode);
    state.loading = false;
    renderStaticText();
  }

  function toggleLanguage(force) {
    state.language = force || (state.language === "en" ? "ar" : "en");
    renderStaticText();
    runSearch(els.searchInput.value || "");
  }

  function bindEvents() {
    els.languageToggle.addEventListener("click", () => toggleLanguage());
    els.searchButton.addEventListener("click", () => runSearch(els.searchInput.value));
    els.searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") runSearch(els.searchInput.value);
    });
    els.micButton.addEventListener("click", () => {
      if (!recognition) {
        showStatus(t().noVoice, true);
        return;
      }
      recognition.lang = containsArabic(els.searchInput.value) || state.language === "ar" ? "ar-SA" : "en-US";
      recognition.start();
    });
  }

  renderStaticText();
  bindEvents();
  renderProducts(PRODUCTS.slice(0, 8).map((p) => ({ ...p, matchReason: state.language === "ar" ? "منتج مميز في الكتالوج" : "Featured catalog product" })), t().aiReady, "fallback");
})();
