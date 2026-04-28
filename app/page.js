"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTS } from "../lib/products";
import { TRANSLATIONS } from "../lib/translations";
import { containsArabic } from "../lib/search";

const FEATURED = PRODUCTS.slice(0, 8);
const FEATURED_RECOMMENDATIONS = PRODUCTS.slice(8, 12);

export default function HomePage() {
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(FEATURED.map((product) => ({ ...product, matchReason: "Featured catalog product" })));
  const [recommendations, setRecommendations] = useState(FEATURED_RECOMMENDATIONS.map((product) => ({ ...product, recommendationReason: "Additional AI-suggested pick" })));
  const [mode, setMode] = useState("fallback");
  const [summary, setSummary] = useState("Gemini AI route ready with keyword fallback");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantOptions, setAssistantOptions] = useState([]);
  const [assistantSuggestions, setAssistantSuggestions] = useState([]);
  const [assistantProducts, setAssistantProducts] = useState([]);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const liveTranscriptRef = useRef("");
  const languageRef = useRef("en");
  const messagesRef = useRef([]);
  const manualStopRef = useRef(false);

  const t = TRANSLATIONS[language];
  const isArabic = language === "ar";

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
    document.documentElement.dir = t.dir;
  }, [t]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    messagesRef.current = assistantMessages;
  }, [assistantMessages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      manualStopRef.current = false;
      finalTranscriptRef.current = "";
      liveTranscriptRef.current = "";
      setLiveTranscript("");
      setIsListening(true);
      setStatus(TRANSLATIONS[languageRef.current].listening);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }
      const completedTranscript = finalTranscriptRef.current.trim() || liveTranscriptRef.current.trim();
      if (completedTranscript) {
        setQuery(completedTranscript);
        setAssistantInput(completedTranscript);
        void askAssistant(completedTranscript, containsArabic(completedTranscript) ? "ar" : languageRef.current);
      } else {
        setStatus("");
      }
    };
    recognition.onerror = (event) => {
      const errorType = event?.error;
      setStatus(errorType === "not-allowed" || errorType === "service-not-allowed"
        ? TRANSLATIONS[languageRef.current].voiceError
        : TRANSLATIONS[languageRef.current].noVoice);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const spoken = result?.[0]?.transcript || "";
        if (result.isFinal) {
          finalText += `${spoken} `;
        } else {
          interim += spoken;
        }
      }

      finalTranscriptRef.current = finalText.trim();
      const combinedTranscript = `${finalText} ${interim}`.trim();
      liveTranscriptRef.current = combinedTranscript;
      setLiveTranscript(combinedTranscript);
      if (combinedTranscript) {
        if (containsArabic(combinedTranscript)) setLanguage("ar");
        setQuery(combinedTranscript);
      }
    };
    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  const metrics = useMemo(() => t.metrics, [t.metrics]);

  async function askAssistant(rawMessage, lang = language) {
    const cleanMessage = rawMessage.trim();
    if (!cleanMessage) return;

    const userMessage = { role: "user", text: cleanMessage };
    const nextHistory = [...messagesRef.current, userMessage];
    setAssistantMessages(nextHistory);
    setAssistantInput("");
    setAssistantLoading(true);
    setStatus(TRANSLATIONS[lang].assistantThinking);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanMessage, language: lang, history: nextHistory })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error("assistant_failed");

      const assistantText = [payload.reply, payload.followUpQuestion].filter(Boolean).join(" ");
      const assistantMessage = { role: "assistant", text: assistantText };
      setAssistantMessages((current) => [...current, assistantMessage]);
      setAssistantOptions(payload.options || []);
      setAssistantSuggestions(payload.suggestedSearches || []);
      setAssistantProducts(payload.recommendedProducts || []);
      setStatus("");
    } catch (_) {
      setAssistantMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: lang === "ar"
            ? "أستطيع مساعدتك في تحويل وصف المشكلة إلى بحث منتجات. جرّبي اختيار اقتراح بحث أو اشرحي أكثر."
            : "I can still help turn that problem into a product search. Try one of the suggested searches or tell me a bit more."
        }
      ]);
      setAssistantOptions([]);
    } finally {
      setAssistantLoading(false);
    }
  }

  async function runSearch(rawQuery = query, lang = language) {
    const cleanQuery = rawQuery.trim();

    if (!cleanQuery) {
      setResults(FEATURED.map((product) => ({ ...product, matchReason: lang === "ar" ? "منتج مميز من الكتالوج" : "Featured catalog product" })));
      setRecommendations(FEATURED_RECOMMENDATIONS.map((product) => ({ ...product, recommendationReason: lang === "ar" ? "اقتراح إضافي للتصفح" : "Additional pick for browsing" })));
      setMode("fallback");
      setSummary(TRANSLATIONS[lang].aiReady);
      return;
    }

    setIsLoading(true);
    setStatus(TRANSLATIONS[lang].aiLoading);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: cleanQuery, language: lang })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "search_failed");

      setResults(payload.results || []);
      setRecommendations(payload.recommendations || []);
      setMode(payload.mode || "fallback");
      setSummary(lang === "ar" ? `عرض النتائج لـ: ${payload.parsed?.intent || cleanQuery}` : `Showing results for: ${payload.parsed?.intent || cleanQuery}`);
      setStatus(payload.mode === "ai" ? "" : TRANSLATIONS[lang].aiOffline);
    } catch (_) {
      setResults([]);
      setRecommendations([]);
      setSummary(TRANSLATIONS[lang].aiFailed);
      setStatus(TRANSLATIONS[lang].aiFailed);
      setMode("fallback");
    } finally {
      setIsLoading(false);
      if (!isListening) {
        window.setTimeout(() => setStatus(""), 1800);
      }
    }
  }

  function toggleLanguage() {
    const nextLanguage = isArabic ? "en" : "ar";
    setLanguage(nextLanguage);
    if (query) void runSearch(query, nextLanguage);
  }

  function startListening() {
    const recognition = recognitionRef.current;
    if (!recognition || !isSpeechSupported) {
      setStatus(t.noVoice);
      return;
    }
    if (isListening) {
      manualStopRef.current = true;
      recognition.stop();
      return;
    }
    setIsAssistantOpen(true);
    finalTranscriptRef.current = "";
    liveTranscriptRef.current = "";
    setLiveTranscript("");
    recognition.lang = isArabic || containsArabic(query) ? "ar-SA" : "en-US";
    try {
      recognition.start();
    } catch (_) {
      setStatus(t.voiceError);
    }
  }

  function openAssistant() {
    setIsAssistantOpen(true);
  }

  function closeAssistant() {
    if (recognitionRef.current && isListening) {
      manualStopRef.current = true;
      recognitionRef.current.stop();
    }
    setIsAssistantOpen(false);
    setIsListening(false);
    setLiveTranscript("");
  }

  async function handleAssistantOption(option) {
    if (option.type === "search") {
      await chooseSuggestedSearch(option.value);
      return;
    }
    setAssistantInput("");
    await askAssistant(option.value, containsArabic(option.value) ? "ar" : languageRef.current);
  }

  async function chooseSuggestedSearch(searchText) {
    setQuery(searchText);
    setAssistantMessages((current) => [
      ...current,
      { role: "user", text: searchText },
      { role: "assistant", text: containsArabic(searchText) ? `سأبحث الآن عن: ${searchText}` : `I’ll search now for: ${searchText}` }
    ]);
    setIsAssistantOpen(false);
    await runSearch(searchText, containsArabic(searchText) ? "ar" : language);
  }

  return (
    <main className="page-shell">
      <section className="announcement-bar">
        <div className="announcement-inner">
          <div className="announcement-items">
            {t.announcement.map((item) => <span key={item}>{item}</span>)}
          </div>
          <button className="ghost-toggle" onClick={toggleLanguage}>{t.languageSwitch}</button>
        </div>
      </section>

      <header className="site-header">
        <div className="header-row">
          <div className="brand-block">
            <div className="brand-mark">☺</div>
            <div>
              <div className="brand-name">Mumzworld</div>
              <div className="brand-sub">{t.deliverTo}</div>
            </div>
          </div>

          <div className="search-cluster">
            <div className="search-frame">
              <input
                className="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && runSearch()}
                placeholder={t.searchPlaceholder}
              />
              <button className="action-btn action-search" onClick={() => runSearch()}>{t.searchButton}</button>
              <button className={`action-btn action-mic ${isListening ? "is-live" : ""}`} onClick={startListening} disabled={!isSpeechSupported}>🎤</button>
            </div>
            <div className="status-row">
              <span>{status || t.aiReady}</span>
              <div className="status-actions">
                <button className="browse-link" onClick={openAssistant}>{t.assistantOpen}</button>
                <button className="browse-link" onClick={() => runSearch("")}>{t.browseButton}</button>
              </div>
            </div>
          </div>

          <div className="account-row">
            <button className="sign-btn">{t.signIn}</button>
            <button className="cart-btn">{t.cart}</button>
          </div>
        </div>

        <nav className="category-strip">
          {t.categoryStrip.map((item, index) => (
            <span key={item} className={`category-pill ${index === 0 ? "sale-pill" : ""}`}>{item}</span>
          ))}
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">{t.heroEyebrow}</span>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
        </div>
        <div className="hero-side">
          <div className="hero-badge">{t.heroBadge}</div>
          <div className="metric-grid">
            {metrics.map(([value, label]) => (
              <article key={value + label} className="metric-card">
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="results-shell">
        <div className="results-head">
          <div>
            <h2>{t.resultsTitle}</h2>
            <p>{isLoading ? t.aiLoading : summary}</p>
          </div>
          <span className="result-badge">{mode === "ai" ? t.aiLabel : t.fallbackLabel}</span>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🧸</div>
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyText}</p>
          </div>
        ) : (
          <div className="results-grid">
            {results.map((product, index) => (
              <article key={product.id} className="product-card" style={{ animationDelay: `${index * 70}ms` }}>
                <div className="product-visual">{product.emoji}</div>
                <div className="product-body">
                  <div className="brand-line">
                    <span>{product.brand}</span>
                    <span>★ {product.rating.toFixed(1)}</span>
                  </div>
                  <h3>{isArabic ? product.nameAr : product.name}</h3>
                  <p>{isArabic ? product.descriptionAr : product.description}</p>
                  <div className="price-row">
                    <strong>AED {product.price}</strong>
                    <span className="mini-badge">{isArabic ? product.categoryAr : product.category}</span>
                  </div>
                  <div className="reason-line">{product.matchReason}</div>
                  <button className="add-btn">{t.addToCart}</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="recommendation-box">
            <div className="recommendation-head">
              <div>
                <h3>{t.recommendationsTitle}</h3>
                <p>{t.recommendationsText}</p>
              </div>
            </div>
            <div className="recommendation-grid">
              {recommendations.map((product) => (
                <article key={`rec-${product.id}`} className="recommendation-card">
                  <div className="recommendation-emoji">{product.emoji}</div>
                  <div className="recommendation-copy">
                    <strong>{isArabic ? product.nameAr : product.name}</strong>
                    <span>{product.brand} · AED {product.price}</span>
                    <p>{product.recommendationReason}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="footer-note">{t.footer}</footer>

      {isAssistantOpen && (
        <div className="listening-overlay" role="dialog" aria-modal="true">
          <div className="assistant-shell">
            <div className="assistant-header">
              <div>
                <h3>{t.listeningTitle}</h3>
                <p>{t.assistantIntro}</p>
              </div>
              <button className="ghost-toggle assistant-close" onClick={closeAssistant}>{t.assistantClose}</button>
            </div>

            <div className="assistant-live">
              <div className="listening-orb">
                {isListening && <>
                  <div className="wave-ring ring-one" />
                  <div className="wave-ring ring-two" />
                  <div className="wave-ring ring-three" />
                </>}
                <button
                  type="button"
                  className={`mic-core mic-core-button ${isListening ? "mic-core-live" : ""}`}
                  onClick={startListening}
                  aria-label={t.listeningTitle}
                >
                  🎤
                </button>
              </div>
              <div className="transcript-panel">
                <label>{t.liveTranscriptLabel}</label>
                <div className="transcript-text">{liveTranscript || t.transcriptPlaceholder}</div>
                <span>{t.listeningHint}</span>
              </div>
            </div>

            <div className="assistant-chat">
              {assistantMessages.length === 0 ? (
                <div className="assistant-empty">{t.listeningBody}</div>
              ) : (
                assistantMessages.map((message, index) => (
                  <article key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                    {message.text}
                  </article>
                ))
              )}
              {assistantLoading && <div className="assistant-thinking">{t.assistantThinking}</div>}
            </div>

            {assistantSuggestions.length > 0 && (
              <div className="assistant-meta-block">
                <label>{t.assistantSuggestedSearches}</label>
                <div className="suggestion-row">
                  {assistantSuggestions.map((item) => (
                    <button key={item} className="suggestion-chip" onClick={() => chooseSuggestedSearch(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {assistantOptions.length > 0 && (
              <div className="assistant-meta-block">
                <label>{t.assistantOptions}</label>
                <div className="suggestion-row">
                  {assistantOptions.map((item) => (
                    <button key={`${item.type}-${item.label}-${item.value}`} className="suggestion-chip option-chip" onClick={() => handleAssistantOption(item)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {assistantProducts.length > 0 && (
              <div className="assistant-meta-block">
                <label>{t.assistantRecommended}</label>
                <div className="assistant-product-list">
                  {assistantProducts.map((product) => (
                    <div key={product.id} className="assistant-product-card">
                      <strong>{product.name}</strong>
                      <p>{product.reason}</p>
                      <button className="browse-link" onClick={() => chooseSuggestedSearch(product.name)}>{t.assistantSearchNow}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="assistant-composer">
              <input
                className="assistant-input"
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && askAssistant(assistantInput)}
                placeholder={t.assistantPlaceholder}
              />
              <button className="action-btn action-search" onClick={() => askAssistant(assistantInput)}>{t.assistantSend}</button>
              <button className={`action-btn action-mic ${isListening ? "is-live" : ""}`} onClick={startListening} disabled={!isSpeechSupported}>🎤</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
