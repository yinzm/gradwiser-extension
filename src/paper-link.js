(() => {
  "use strict";

  const SOURCE_HOSTS = new Set([
    "arxiv.org",
    "www.arxiv.org",
    "export.arxiv.org",
  ]);
  // Keep identity validation aligned with GradWiser's public arxiv-id parser.
  const NEW_ID = /^([0-9]{2})(0[1-9]|1[0-2])\.([0-9]{4,5})(v[1-9][0-9]*)?$/i;
  const OLD_ID = /^([a-z-]+(?:\.[a-z-]+)?)\/([0-9]{7})(v[1-9][0-9]*)?$/i;
  const MAX_URL_LENGTH = 2048;
  const MAX_REDIRECTS = 4;

  function normalizeIdentity(raw) {
    try {
      const decoded = decodeURIComponent(raw);
      if (/[%\\?#]/.test(decoded)) return null;
      const id = decoded.replace(/\.pdf$/i, "");
      const modern = NEW_ID.exec(id);
      const legacy = OLD_ID.exec(id);
      if (!modern && !legacy) return null;
      const version = modern?.[4] ?? legacy?.[3] ?? null;
      const externalId = version ? id.slice(0, -version.length) : id;
      const requestedVersion = version?.toLowerCase() ?? null;
      return {
        externalId,
        requestedVersion,
        versionedId: `${externalId}${requestedVersion ?? ""}`,
      };
    } catch {
      return null;
    }
  }

  function parsePaperUrl(input, baseOrigin) {
    if (typeof input !== "string") return null;
    let value = input.trim();
    for (let depth = 0; depth <= MAX_REDIRECTS; depth++) {
      if (
        !value ||
        value.length > MAX_URL_LENGTH ||
        value.includes("#") ||
        value.includes("\\") ||
        /(?:^|\/)(?:\.|%2e){1,2}(?:\/|%2f|$)/i.test(value)
      ) {
        return null;
      }
      try {
        const url = new URL(value, baseOrigin);
        if (url.protocol !== "https:" || url.username || url.password) {
          return null;
        }
        if (url.hostname === "www.google.com" && url.pathname === "/url") {
          const destination =
            url.searchParams.get("url") || url.searchParams.get("q");
          if (!destination || depth === MAX_REDIRECTS) return null;
          value = destination.trim();
          // A relative redirect destination belongs to Google, not the source page.
          baseOrigin = url.origin;
          continue;
        }
        if (!SOURCE_HOSTS.has(url.hostname) || url.search) return null;
        const route = /^\/(abs|pdf|html)\/(.+)$/i.exec(url.pathname);
        return route ? normalizeIdentity(route[2]) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  function browserLocale(browser = {}) {
    const language = browser.language || browser.languages?.[0] || "en";
    return /^zh(?:-|$)/i.test(language) ? "zh" : "en";
  }

  function paperUrl(identity, locale) {
    const normalized = normalizeIdentity(identity?.versionedId ?? "");
    if (!normalized) return null;
    const prefix = locale === "zh" ? "/zh/abs/" : "/abs/";
    return new URL(
      `${prefix}${normalized.versionedId}`,
      "https://gradwiser.com",
    ).href;
  }

  function linkCopy(locale) {
    return locale === "zh"
      ? {
          text: "与论文 AI 对话",
          label: "在 GradWiser 中与这篇论文 AI 对话",
          hint: "GradWiser · 打开论文摘要",
        }
      : {
          text: "AI Chat with Paper",
          label: "Chat with this paper in GradWiser",
          hint: "GradWiser · Open the paper abstract.",
        };
  }

  // Content scripts share an isolated world, not the host page's JS globals.
  globalThis.GradWiserPaperLink = Object.freeze({
    parsePaperUrl,
    browserLocale,
    paperUrl,
    linkCopy,
  });
})();
