const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { setTimeout: delay } = require("node:timers/promises");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.resolve(__dirname, "..");
const scripts = ["src/paper-link.js", "src/content.js"].map((file) =>
  readFileSync(path.join(root, file), "utf8"),
);

function page(t, html, url, language = "en-US") {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const dom = new JSDOM(html, {
    url,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole,
  });
  t.after(() => {
    dom.window.dispatchEvent(new dom.window.Event("pagehide"));
    dom.window.close();
    assert.deepEqual(errors, [], "unexpected content-script errors");
  });
  Object.defineProperty(dom.window.navigator, "language", {
    configurable: true,
    value: language,
  });
  for (const key of ["fetch", "XMLHttpRequest", "WebSocket", "open"]) {
    dom.window[key] = () => {
      throw new Error(`Unexpected extension network/navigation: ${key}`);
    };
  }
  for (const script of scripts) dom.window.eval(script);
  return dom.window;
}

async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await delay(10);
  }
  assert.fail("DOM did not reach the expected state");
}

function result(id, source = "https://arxiv.org/abs/1706.03762v7") {
  return `<div class="result" id="${id}"><div class="yuRUbf"><span style="transform:scaleY(-1)"><a class="title" href="${source}"><h3 style="transform:scaleY(-1)">Paper</h3></a></span></div><p>Snippet</p></div>`;
}

function entries(window) {
  return [
    ...window.document.querySelectorAll('[data-gradwiser-entry="google"]'),
  ];
}

function entryLink(host) {
  return host.shadowRoot.querySelector("a");
}

function assertNativeLink(link, href, text, lang) {
  assert.equal(link.tagName, "A");
  assert.equal(link.href, href);
  assert.equal(link.textContent, text);
  assert.equal(link.lang, lang);
  assert.equal(link.target, "_blank");
  assert.ok(link.rel.includes("noopener"));
  assert.ok(link.rel.includes("noreferrer"));
  assert.equal(
    link.getAttribute("aria-label"),
    lang === "zh"
      ? "在 GradWiser 中打开这篇论文"
      : "Open this paper in GradWiser",
  );
}

test("arXiv uses a native localized public link as its first Access Paper action", async (t) => {
  const w = page(
    t,
    '<div class="extra-services"><div class="full-text"><ul><li>PDF</li></ul></div></div>',
    "https://arxiv.org/abs/hep-th/9901001v2",
    "zh-TW",
  );
  const list = w.document.querySelector("ul");
  assert.equal(
    list.firstElementChild.getAttribute("data-gradwiser-entry"),
    "arxiv",
  );
  assertNativeLink(
    list.querySelector("a"),
    "https://gradwiser.com/zh/abs/hep-th/9901001v2",
    "在 GradWiser 中打开",
    "zh",
  );
  w.document.body.append(w.document.createElement("p"));
  await delay(150);
  assert.equal(
    w.document.querySelectorAll('[data-gradwiser-entry="arxiv"]').length,
    1,
  );
  assert.equal(w.document.querySelector("button"), null);
});

test("arXiv recovers an asynchronously mounted or replaced access list", async (t) => {
  const w = page(
    t,
    '<div class="extra-services"><div class="full-text"></div></div>',
    "https://arxiv.org/abs/1706.03762",
  );
  const fullText = w.document.querySelector(".full-text");
  fullText.innerHTML = "<ul><li>PDF</li></ul>";
  await until(() => fullText.querySelector("a"));
  assert.equal(
    fullText.querySelector("a").href,
    "https://gradwiser.com/abs/1706.03762",
  );
  fullText.innerHTML = "<ul><li>Other</li></ul>";
  await until(() => fullText.querySelector("a"));
  assert.equal(
    fullText.querySelectorAll('[data-gradwiser-entry="arxiv"]').length,
    1,
  );
  fullText.querySelector('[data-gradwiser-entry="arxiv"]').remove();
  await until(() => fullText.querySelector("a"));
  fullText.querySelector("a").remove();
  await until(() => fullText.querySelector("a"));
  const item = w.document.createElement("li");
  fullText.querySelector("ul").prepend(item);
  await until(() =>
    fullText
      .querySelector("ul")
      .firstElementChild.hasAttribute("data-gradwiser-entry"),
  );
});

test("Google only injects recognized result titles inside #rso, not ads or unrelated headings", (t) => {
  const html = `${result("outside")}<div id="rso">${result("paper")}${result("other", "https://example.com/abs/1706.03762")}<div data-text-ad>${result("ad")}</div><h3>People also ask</h3></div>`;
  const w = page(t, html, "https://www.google.com/search?q=arxiv", "zh-CN");
  assert.equal(entries(w).length, 1);
  const host = entries(w)[0];
  assert.equal(host.parentElement.className, "yuRUbf");
  assert.equal(host.closest(".result").id, "paper");
  assert.equal(host.closest("a"), null);
  assert.equal(host.closest("span[style]"), null);
  assertNativeLink(
    entryLink(host),
    "https://gradwiser.com/zh/abs/1706.03762v7",
    "在 GradWiser 中打开",
    "zh",
  );
  assert.equal(
    w.document.querySelector(".title").getAttribute("data-gradwiser-source"),
    null,
  );
});

test("a reused Google title link updates version and removes the entry for non-arXiv targets", async (t) => {
  const w = page(
    t,
    `<div id="rso">${result("paper")}</div>`,
    "https://www.google.com/search?q=arxiv",
  );
  const title = w.document.querySelector(".title");
  title.href = "https://arxiv.org/html/1706.03762v1";
  await until(
    () =>
      entryLink(entries(w)[0]).href ===
      "https://gradwiser.com/abs/1706.03762v1",
  );
  title.href = "https://example.com/abs/1706.03762";
  await until(() => entries(w).length === 0);
  title.href = "https://export.arxiv.org/pdf/1706.03762v2.pdf";
  await until(() => entries(w).length === 1);
  assert.equal(
    entryLink(entries(w)[0]).href,
    "https://gradwiser.com/abs/1706.03762v2",
  );
});

test("Google repairs a removed entry and reconciles moved, removed, and replaced results", async (t) => {
  const w = page(
    t,
    `<div id="search"><div id="rso">${result("one")}${result("two", "https://arxiv.org/abs/2505.04421v1")}</div></div>`,
    "https://www.google.com/search?q=arxiv",
  );
  assert.equal(entries(w).length, 2);
  entries(w)[0].remove();
  await until(() => entries(w).length === 2);
  w.document.querySelector("#one .yuRUbf").innerHTML =
    '<a href="https://arxiv.org/abs/1706.03762v2"><h3>Replaced title</h3></a>';
  await until(() =>
    entries(w).some((host) => entryLink(host).href.endsWith("1706.03762v2")),
  );
  w.document.querySelector("#two").remove();
  await until(() => entries(w).length === 1);
  w.document.querySelector("#rso").remove();
  await until(() => entries(w).length === 0);
  w.document.querySelector("#search").innerHTML =
    `<div id="rso">${result("new")}</div>`;
  await until(() => entries(w).length === 1);
  assert.equal(entries(w)[0].closest(".result").id, "new");
});

test("renaming the Google result root clears stale entries and restores them when supported again", async (t) => {
  const w = page(
    t,
    `<div id="rso">${result("paper")}</div>`,
    "https://www.google.com/search?q=arxiv",
  );
  const root = w.document.querySelector("#rso");
  root.id = "unsupported";
  await until(() => entries(w).length === 0);
  root.id = "rso";
  await until(() => entries(w).length === 1);
});

test("Google skips transformed ancestors and recovers after the transform is removed", async (t) => {
  const w = page(
    t,
    `<div style="transform:scaleY(-1)" id="ancestor"><div id="rso">${result("one")}</div></div>`,
    "https://www.google.com/search?q=arxiv",
  );
  assert.equal(entries(w).length, 0);
  w.document.querySelector("#ancestor").style.transform = "none";
  await until(() => entries(w).length === 1);
  w.document.querySelector("#ancestor").style.transform = "scaleY(-1)";
  await until(() => entries(w).length === 0);
});

test("unknown Google markup falls back only to a safe single-title container", (t) => {
  const w = page(
    t,
    '<div id="rso"><div><span style="transform:scaleY(-1)"><a href="https://arxiv.org/abs/1706.03762"><h3>Paper</h3></a></span></div></div>',
    "https://www.google.com/search?q=arxiv",
  );
  assert.equal(entries(w).length, 1);
  assert.equal(entries(w)[0].parentElement.tagName, "DIV");
  assert.equal(entries(w)[0].parentElement.id, "");
});

test("languagechange updates the existing entry's text, accessible name, and destination", async (t) => {
  const w = page(
    t,
    `<div id="rso">${result("paper")}</div>`,
    "https://www.google.com/search?q=arxiv",
    "en-US",
  );
  const host = entries(w)[0];
  assertNativeLink(
    entryLink(host),
    "https://gradwiser.com/abs/1706.03762v7",
    "Open in GradWiser",
    "en",
  );
  Object.defineProperty(w.navigator, "language", {
    configurable: true,
    value: "zh-Hant",
  });
  w.dispatchEvent(new w.Event("languagechange"));
  await until(() => entryLink(host).lang === "zh");
  assert.equal(entries(w)[0], host);
  assertNativeLink(
    entryLink(host),
    "https://gradwiser.com/zh/abs/1706.03762v7",
    "在 GradWiser 中打开",
    "zh",
  );
});

test("mutation bursts are batched and injection does not cause a self-triggered scan loop", async (t) => {
  const w = page(
    t,
    `<div id="rso">${result("paper")}</div>`,
    "https://www.google.com/search?q=arxiv",
  );
  await delay(100); // Let jsdom's initial pageshow complete before counting batches.
  const root = w.document.querySelector("#rso");
  const original = root.querySelectorAll.bind(root);
  let scans = 0;
  root.querySelectorAll = (selector) => {
    if (selector === "h3") scans++;
    return original(selector);
  };
  for (let i = 0; i < 30; i++)
    w.document.querySelector(".title").href =
      `https://arxiv.org/abs/1706.03762v${i + 1}`;
  await until(() => entryLink(entries(w)[0]).href.endsWith("v30"));
  await delay(170);
  assert.equal(scans, 1);
  assert.equal(entries(w).length, 1);
});

test("pagehide pauses observation and pageshow reconciles browser back/forward restoration", async (t) => {
  const w = page(
    t,
    `<div id="rso">${result("paper")}</div>`,
    "https://www.google.com/search?q=arxiv",
  );
  await delay(100);
  w.dispatchEvent(new w.Event("pagehide"));
  w.document.querySelector(".title").href =
    "https://arxiv.org/abs/1706.03762v1";
  await delay(120);
  assert.ok(entryLink(entries(w)[0]).href.endsWith("v7"));
  w.dispatchEvent(new w.Event("pageshow"));
  assert.ok(entryLink(entries(w)[0]).href.endsWith("v1"));
});

test("unsupported pages and invalid arXiv identities do not get entries", (t) => {
  for (const url of [
    "https://arxiv.org/abs/1706.03762v0",
    "https://www.google.com/search-other",
    "https://notarxiv.org/abs/1706.03762",
  ]) {
    const w = page(
      t,
      `<div class="extra-services"><div class="full-text"><ul></ul></div></div><div id="rso">${result("paper")}</div>`,
      url,
    );
    assert.equal(
      w.document.querySelectorAll("[data-gradwiser-entry]").length,
      0,
    );
  }
});
