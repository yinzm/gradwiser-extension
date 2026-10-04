(() => {
  "use strict";

  const { parsePaperUrl, browserLocale, paperUrl, linkCopy } =
    globalThis.GradWiserPaperLink;
  const ENTRY_ATTRIBUTE = "data-gradwiser-entry";
  const TITLE_ROW_CLASS = "gradwiser-google-title-row";
  const STACKED_ROW_CLASS = "gradwiser-google-title-row--stacked";
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
    const { text, label, hint } = linkCopy(locale);
    const href = paperUrl(identity, locale);
    const caption = link.querySelector(".gradwiser-link-caption") || link;
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
    if (caption.textContent !== text) caption.textContent = text;
    if (link.getAttribute("aria-label") !== label)
      link.setAttribute("aria-label", label);
    if (link.title !== hint) link.title = hint;
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
        display: inline-flex;
        grid-column: 2;
        grid-row: 1;
        align-self: start;
        margin-block-start: var(--gradwiser-title-offset, 0px);
        max-width: 100%;
      }
      :host([data-layout="stacked"]) {
        grid-column: 1;
        grid-row: 2;
        margin: 6px 0 2px;
      }
      a {
        all: initial;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        max-width: 100%;
        border: 1px solid #4434bf;
        gap: 5px;
        background: #f6f4ff;
        border-radius: 6px;
        color: #4434bf;
        cursor: pointer;
        direction: ltr;
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
        padding: 3px 8px;
        text-align: center;
        text-decoration: none;
        unicode-bidi: isolate;
        white-space: nowrap;
        writing-mode: horizontal-tb;
      }
      svg { width: 14px; height: 14px; flex: none; }
      a:hover, a:focus-visible {
        background: #ede9ff;
        outline: 2px solid #4434bf;
        outline-offset: 2px;
      }
    `;
    const link = createLink(identity);
    const caption = document.createElement("span");
    caption.className = "gradwiser-link-caption";
    caption.textContent = link.textContent;
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.8");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M7 18 3 21V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7M7 8h10M7 12h7",
    );
    icon.append(path);
    link.replaceChildren(icon, caption);
    shadow.append(style, link);
    return { host, link, container: null, heading: null };
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
    const hasSingleContent = (node) =>
      [...node.children].filter((child) => !child.hasAttribute(ENTRY_ATTRIBUTE))
        .length === 1;
    if (row) {
      if (
        !root.contains(row) ||
        row.querySelectorAll("h3").length !== 1 ||
        !hasSingleContent(row)
      )
        return null;
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
      if (hasSingleContent(node) && !hasTransformedAncestor(node)) return node;
    }
    return null;
  }

  function releaseGoogleLayout(entry) {
    entry.container?.classList.remove(TITLE_ROW_CLASS, STACKED_ROW_CLASS);
    for (const node of [entry.container, entry.heading, entry.host]) {
      if (node) resizeObserver?.unobserve(node);
    }
  }

  function firstTitleGlyph(heading) {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const index = text.textContent.search(/\S/);
      if (index < 0) continue;
      const range = document.createRange();
      range.setStart(text, index);
      range.setEnd(text, index + 1);
      const rect = range.getBoundingClientRect?.();
      if (rect?.width && rect.height) return rect;
    }
    const rect = heading.getBoundingClientRect();
    const style = getComputedStyle(heading);
    return {
      top: rect.top + (parseFloat(style.paddingTop) || 0),
      height: parseFloat(style.lineHeight) || 24,
    };
  }

  function layoutGoogleEntry(entry, container, heading) {
    if (entry.container !== container || entry.heading !== heading) {
      releaseGoogleLayout(entry);
      entry.container = container;
      entry.heading = heading;
    }
    container.classList.add(TITLE_ROW_CLASS);
    if (entry.host.parentElement !== container) container.append(entry.host);
    const stacked =
      window.innerWidth < 600 || container.getBoundingClientRect().width < 480;
    container.classList.toggle(STACKED_ROW_CLASS, stacked);
    entry.host.setAttribute("data-layout", stacked ? "stacked" : "inline");
    if (stacked) {
      entry.host.style.removeProperty("--gradwiser-title-offset");
    } else {
      // Google can invert the title's ancestors. Measure its first visible
      // glyph in the rendered page instead of inheriting that transform.
      const glyph = firstTitleGlyph(heading);
      const offset = Math.max(
        0,
        glyph.top -
          container.getBoundingClientRect().top +
          (glyph.height - entry.link.getBoundingClientRect().height) / 2,
      );
      const value = `${Math.round(offset * 100) / 100}px`;
      if (
        entry.host.style.getPropertyValue("--gradwiser-title-offset") !== value
      ) {
        entry.host.style.setProperty("--gradwiser-title-offset", value);
      }
    }
    for (const node of [container, heading, entry.host])
      resizeObserver?.observe(node);
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
      desired.set(titleLink, { identity, container, heading });
    }

    for (const [titleLink, entry] of googleEntries) {
      if (!desired.has(titleLink)) {
        releaseGoogleLayout(entry);
        entry.host.remove();
        googleEntries.delete(titleLink);
      }
    }
    for (const [titleLink, { identity, container, heading }] of desired) {
      let entry = googleEntries.get(titleLink);
      if (!entry) {
        entry = createGoogleEntry(identity);
        googleEntries.set(titleLink, entry);
      }
      updateLink(entry.link, identity);
      layoutGoogleEntry(entry, container, heading);
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

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(scheduleScan)
      : null;

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
  window.addEventListener("resize", scheduleScan);
  window.addEventListener("pagehide", () => {
    paused = true;
    observer.disconnect();
    resizeObserver?.disconnect();
    window.clearTimeout(scanTimer);
    scanTimer = null;
  });
  window.addEventListener("pageshow", () => {
    paused = false;
    scan();
  });
  scan();
})();
