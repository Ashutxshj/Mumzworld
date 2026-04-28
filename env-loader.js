(function () {
  window.APP_CONFIG = window.APP_CONFIG || {};
  window.APP_CONFIG_READY = (async function () {
    if (window.APP_CONFIG.geminiApiKey) return;

    function parseEnv(text) {
      const trimmed = (text || "").trim();
      if (!trimmed) return "";

      // Support either GEMINI_API_KEY=value, GOOGLE_API_KEY=value, or a raw key-only file.
      if (!trimmed.includes("=")) return trimmed;

      let fallbackValue = "";
      const lines = trimmed.split(/\r?\n/);
      for (const line of lines) {
        const clean = line.trim();
        if (!clean || clean.startsWith("#")) continue;
        const match = clean.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
        if (!match) continue;
        const key = match[1];
        const value = match[2].trim().replace(/^['"]|['"]$/g, "");
        if (key === "GEMINI_API_KEY" || key === "GOOGLE_API_KEY") return value;
        if (!fallbackValue) fallbackValue = value;
      }
      return fallbackValue;
    }

    try {
      if (window.location.protocol === "file:") return;
      const response = await fetch(".env", { cache: "no-store" });
      if (!response.ok) return;
      const text = await response.text();
      const apiKey = parseEnv(text);
      if (apiKey) {
        window.APP_CONFIG.geminiApiKey = apiKey;
      }
    } catch (_) {
      // No-op. The app will fall back to local search.
    }
  })();
})();
