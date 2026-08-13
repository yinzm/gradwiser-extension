(() => {
  "use strict";

  const GRADWISER_ORIGIN = "https://gradwiser.com";
  const IMPORT_PATH = "/papers/import";
  const BUTTON_ATTRIBUTE = "data-gradwiser-import";

  function toCanonicalArxivUrl(value) {
    try {
      const url = new URL(value, window.location.origin);
      if (url.hostname === "www.google.com" && url.pathname === "/url") {
        const destination =
          url.searchParams.get("url") || url.searchParams.get("q");
        return destination ? toCanonicalArxivUrl(destination) : null;
      }
      if (!["arxiv.org", "www.arxiv.org"].includes(url.hostname)) return null;

      const match = url.pathname.match(/^\/(?:abs|pdf|html)\/(.+)$/i);
      if (!match) return null;

      const identifier = decodeURIComponent(match[1]).replace(/\.pdf$/i, "");
      const modernId = /^\d{4}\.\d{4,5}(?:v\d+)?$/;
      const legacyId = /^[a-z-]+(?:\.[A-Z]{2})?\/\d{7}(?:v\d+)?$/i;
      if (!modernId.test(identifier) && !legacyId.test(identifier)) return null;

      return `https://arxiv.org/abs/${identifier}`;
    } catch {
      return null;
    }
  }

  function importUrl(sourceUrl) {
    const target = new URL(IMPORT_PATH, GRADWISER_ORIGIN);
    target.searchParams.set("source", sourceUrl);
    target.searchParams.set("utm_source", "gradwiser-extension");
    target.searchParams.set("utm_medium", "browser-extension");
    return target.toString();
  }

  function openGradWiser(sourceUrl) {
    window.open(importUrl(sourceUrl), "_blank", "noopener");
  }

  function createImportButton(sourceUrl, variant) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `gradwiser-import-button gradwiser-import-button--${variant}`;
    button.setAttribute(BUTTON_ATTRIBUTE, "true");
    button.setAttribute("aria-label", "Open this paper in GradWiser");
    button.textContent = "在 GradWiser 中打开";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openGradWiser(sourceUrl);
    });
    return button;
  }

  function createGoogleEntryPoint(sourceUrl) {
    const host = document.createElement("span");
    host.className = "gradwiser-google-entry-point";
    host.setAttribute(BUTTON_ATTRIBUTE, "google");
    host.dataset.gradwiserSource = sourceUrl;

    // A Shadow Root keeps Google-wide button and typography rules from
    // changing the control, while the host itself remains in normal document
    // flow and therefore scrolls away with its own search result.
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
        display: block;
        margin: 6px 0 4px;
        text-align: right;
      }
      a {
        all: initial;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        border: 1px solid #283593;
        border-radius: 999px;
        color: #283593;
        cursor: pointer;
        direction: ltr;
        font-family: Arial, sans-serif;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.25;
        padding: 6px 10px;
        text-decoration: none;
        transform: none;
        unicode-bidi: isolate;
        white-space: nowrap;
        writing-mode: horizontal-tb;
      }
      a:hover, a:focus-visible {
        background: #eef0ff;
        outline: 2px solid #283593;
        outline-offset: 2px;
      }
    `;
    const link = document.createElement("a");
    link.href = importUrl(sourceUrl);
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "在 GradWiser 中打开";
    link.setAttribute("aria-label", "Open this paper in GradWiser");
    shadow.append(style, link);
    return host;
  }

  function addArxivEntryPoint() {
    const sourceUrl = toCanonicalArxivUrl(window.location.href);
    if (!sourceUrl || document.querySelector(`[${BUTTON_ATTRIBUTE}="arxiv"]`)) {
      return;
    }

    const fullTextLinks = document.querySelector(".extra-services .full-text");
    const linkList = fullTextLinks?.querySelector("ul");
    if (!linkList) return;

    const entryPoint = createImportButton(sourceUrl, "arxiv");
    entryPoint.setAttribute(BUTTON_ATTRIBUTE, "arxiv");
    const listItem = document.createElement("li");
    listItem.className = "gradwiser-arxiv-entry-point";
    listItem.append(entryPoint);
    linkList.prepend(listItem);
  }

  function addGoogleEntryPoints() {
    for (const heading of document.querySelectorAll("h3")) {
      const titleLink = heading.closest("a[href]");
      if (!titleLink || titleLink.dataset.gradwiserSource) continue;

      const sourceUrl = toCanonicalArxivUrl(titleLink.href);
      if (!sourceUrl) continue;

      // Google currently places the title link inside a V9tjod span with
      // scaleY(-1).  Appending beside that link flips any injected content,
      // including content in a Shadow Root.  Put the CTA after the whole title
      // row instead, which is still inside this result card but outside the
      // transformed span.  The fallback supports markup variants that do not
      // expose Google’s current yuRUbf wrapper.
      const titleContainer =
        titleLink.closest(".yuRUbf") ||
        titleLink.parentElement?.parentElement?.parentElement;
      if (
        !titleContainer ||
        getComputedStyle(titleContainer).transform !== "none"
      ) {
        continue;
      }

      const entryPoint = createGoogleEntryPoint(sourceUrl);
      titleLink.dataset.gradwiserSource = sourceUrl;
      titleContainer.append(entryPoint);
    }
  }

  function initialize() {
    if (window.location.hostname.endsWith("arxiv.org")) {
      addArxivEntryPoint();
      return;
    }

    if (window.location.hostname === "www.google.com") {
      addGoogleEntryPoints();
      const observer = new MutationObserver(() => addGoogleEntryPoints());
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }

  initialize();
})();
