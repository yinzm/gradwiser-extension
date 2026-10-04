(() => {
  "use strict";

  const { parsePaperUrl, browserLocale, paperUrl, linkCopy } =
    globalThis.GradWiserPaperLink;
  const ENTRY_ATTRIBUTE = "data-gradwiser-entry";
  const SCAN_DELAY = 80;
  const googleEntries = new Map();
  let arxivEntry = null;
  let googleRoot = null;
  let scanTimer = null;
  let paused = false;

  const isArxiv = ["arxiv.org", "www.arxiv.org"].includes(location.hostname);
  const isGoogle =
    location.hostname === "www.google.com" && location.pathname === "/search";
  if (!isArxiv && !isGoogle) return;

  function updateLink(link, identity) {
    const locale = browserLocale(navigator);
    const { text, label } = linkCopy(locale);
    const href = paperUrl(identity, locale);
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
    if (link.textContent !== text) link.textContent = text;
    if (link.getAttribute("aria-label") !== label)
      link.setAttribute("aria-label", label);
    if (link.lang !== locale) link.lang = locale;
  }

  function createLink(identity) {
    const link = document.createElement("a");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    updateLink(link, identity);
    return link;
  }

  function syncArxivEntry() {
    const identity = parsePaperUrl(location.href);
    const list = document.querySelector(".extra-services .full-text ul");
    if (!identity || !list) {
      arxivEntry?.host.remove();
      arxivEntry = null;
      return;
    }
    if (!arxivEntry || arxivEntry.host.parentElement !== list) {
      arxivEntry?.host.remove();
      const host = document.createElement("li");
      host.className = "gradwiser-arxiv-entry";
      host.setAttribute(ENTRY_ATTRIBUTE, "arxiv");
      const link = createLink(identity);
      link.className = "gradwiser-paper-link";
      host.append(link);
      list.prepend(host);
      arxivEntry = { host, link };
    } else {
      updateLink(arxivEntry.link, identity);
      if (arxivEntry.link.parentElement !== arxivEntry.host)
        arxivEntry.host.append(arxivEntry.link);
      if (list.firstElementChild !== arxivEntry.host)
        list.prepend(arxivEntry.host);
    }
  }

  function createGoogleEntry(identity) {
    const host = document.createElement("span");
    host.className = "gradwiser-google-entry";
    host.setAttribute(ENTRY_ATTRIBUTE, "google");
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
        max-width: 100%;
        border: 1px solid #4434bf;
        border-radius: 999px;
        color: #4434bf;
        cursor: pointer;
        direction: ltr;
        font-family: Arial, sans-serif;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.4;
        padding: 6px 10px;
        text-align: center;
        text-decoration: none;
        unicode-bidi: isolate;
        white-space: normal;
        writing-mode: horizontal-tb;
      }
      a:hover, a:focus-visible {
        background: #f0edff;
        outline: 2px solid #4434bf;
        outline-offset: 2px;
      }
    `;
    const link = createLink(identity);
    shadow.append(style, link);
    return { host, link };
  }

  function hasTransformedAncestor(element) {
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (
        (style.transform && style.transform !== "none") ||
        (style.scale && !["none", "1", "1 1"].includes(style.scale)) ||
        (style.rotate && style.rotate !== "none" && style.rotate !== "0deg")
      ) {
        return true;
      }
    }
    return false;
  }

  function googleTitleContainer(titleLink, root) {
    if (titleLink.closest("[data-text-ad], [data-ad], [data-pla]")) return null;
    const row = titleLink.closest(".yuRUbf");
    if (row && root.contains(row) && row.querySelectorAll("h3").length === 1) {
      return hasTransformedAncestor(row) ? null : row;
    }
    // Fail closed for unknown multi-result wrappers. The fallback must contain
    // exactly one title and be outside all transformed ancestors of the CTA.
    for (
      let node = titleLink.parentElement;
      node && node !== root;
      node = node.parentElement
    ) {
      if (node.tagName === "A" || node.querySelectorAll("h3").length !== 1)
        return null;
      if (!hasTransformedAncestor(node)) return node;
    }
    return null;
  }

  function syncGoogleEntries() {
    const root = document.querySelector("#rso");
    googleRoot = root;
    const desired = new Map();
    const usedContainers = new Set();
    for (const heading of root?.querySelectorAll("h3") ?? []) {
      const titleLink = heading.closest("a[href]");
      if (!titleLink) continue;
      // Read the raw attribute so URL normalization cannot hide dot segments.
      const identity = parsePaperUrl(
        titleLink.getAttribute("href"),
        location.origin,
      );
      if (!identity) continue;
      const container = googleTitleContainer(titleLink, root);
      if (!container || usedContainers.has(container)) continue;
      usedContainers.add(container);
      desired.set(titleLink, { identity, container });
    }

    for (const [titleLink, entry] of googleEntries) {
      if (!desired.has(titleLink)) {
        entry.host.remove();
        googleEntries.delete(titleLink);
      }
    }
    for (const [titleLink, { identity, container }] of desired) {
      let entry = googleEntries.get(titleLink);
      if (!entry) {
        entry = createGoogleEntry(identity);
        googleEntries.set(titleLink, entry);
      }
      updateLink(entry.link, identity);
      if (entry.host.parentElement !== container) container.append(entry.host);
    }
  }

  const observer = new MutationObserver((records) => {
    if (paused) return;
    if (isArxiv) {
      scheduleScan();
      return;
    }
    const root = document.querySelector("#rso") || googleRoot;
    if (
      records.some((record) => {
        const target = record.target;
        if (root && (root.contains(target) || target.contains(root)))
          return true;
        return [...record.addedNodes, ...record.removedNodes].some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.id === "rso" || node.querySelector("#rso")),
        );
      })
    )
      scheduleScan();
  });

  function observe() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "class", "style", "id"],
    });
  }

  function scan() {
    if (paused) return;
    // Our own writes must not schedule another scan. External removal of an
    // entry is still observed and repaired on the next batch.
    observer.disconnect();
    try {
      if (isArxiv) syncArxivEntry();
      else syncGoogleEntries();
    } finally {
      observe();
    }
  }

  function scheduleScan() {
    if (paused || scanTimer !== null) return;
    scanTimer = window.setTimeout(() => {
      scanTimer = null;
      scan();
    }, SCAN_DELAY);
  }

  window.addEventListener("languagechange", scheduleScan);
  window.addEventListener("pagehide", () => {
    paused = true;
    observer.disconnect();
    window.clearTimeout(scanTimer);
    scanTimer = null;
  });
  window.addEventListener("pageshow", () => {
    paused = false;
    scan();
  });
  scan();
})();
