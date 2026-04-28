"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTS } from "../lib/products";
import { TRANSLATIONS } from "../lib/translations";
import { containsArabic } from "../lib/search";

const FEATURED = PRODUCTS.slice(0, 8);

export default function HomePage() {
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(FEATURED.map((product) => ({ ...product, matchReason: "Featured catalog product" })));
  const [mode, setMode] = useState("fallback");
  const [summary, setSummary] = useState("Gemini AI route ready with keyword fallback");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("");
  const recognitionRef = useRef(null);

  const t = TRANSLATIONS[language];
  const isArabic = language === "ar";

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
    document.documentElement.dir = t.dir;
  }, [t]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setStatus(t.listening);
    };
    recognition.onend = () => {
      setIsListening(false);
      setStatus("");
    };
    recognition.onerror = () => {
      setStatus(t.voiceError);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
      if (!transcript) return;
      if (containsArabic(transcript)) setLanguage("ar");
      setQuery(transcript);
      void runSearch(transcript, containsArabic(transcript) ? "ar" : language);
    };
    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, [language, t.listening, t.voiceError]);

  const metrics = useMemo(() => t.metrics, [t.metrics]);

  async function runSearch(rawQuery = query, lang = language) {
    const cleanQuery = rawQuery.trim();

    if (!cleanQuery) {
      setResults(FEATURED.map((product) => ({ ...product, matchReason: lang === "ar" ? "منتج مميز من الكتالوج" : "Featured catalog product" })));
      setMode("fallback");
      setSummary(t.aiReady);
      return;
    }

    setIsLoading(true);
    setStatus(t.aiLoading);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: cleanQuery, language: lang })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "search_failed");

      setResults(payload.results || []);
      setMode(payload.mode || "fallback");
      setSummary(lang === "ar" ? `عرض النتائج لـ: ${payload.parsed?.intent || cleanQuery}` : `Showing results for: ${payload.parsed?.intent || cleanQuery}`);
      setStatus(payload.mode === "ai" ? "" : t.aiOffline);
    } catch (_) {
      setResults([]);
      setSummary(t.aiFailed);
      setStatus(t.aiFailed);
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
    if (!recognition) {
      setStatus(t.noVoice);
      return;
    }
    recognition.lang = isArabic || containsArabic(query) ? "ar-SA" : "en-US";
    recognition.start();
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
              <button className={`action-btn action-mic ${isListening ? "is-live" : ""}`} onClick={startListening}>🎤</button>
            </div>
            <div className="status-row">
              <span>{status || t.aiReady}</span>
              <button className="browse-link" onClick={() => runSearch("")}>{t.browseButton}</button>
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
      </section>

      <footer className="footer-note">{t.footer}</footer>

      {isListening && (
        <div className="listening-overlay" role="dialog" aria-modal="true">
          <div className="listening-orb">
            <div className="wave-ring ring-one" />
            <div className="wave-ring ring-two" />
            <div className="wave-ring ring-three" />
            <div className="mic-core">🎤</div>
          </div>
          <h3>{t.listeningTitle}</h3>
          <p>{t.listeningBody}</p>
          <span>{t.listeningHint}</span>
        </div>
      )}
    </main>
  );
}
