const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = { URL };
vm.runInNewContext(
  readFileSync(path.join(root, "src/paper-link.js"), "utf8"),
  context,
);
const { parsePaperUrl, browserLocale, paperUrl, linkCopy } =
  context.GradWiserPaperLink;

for (const [input, versionedId, externalId, version] of [
  ["https://arxiv.org/abs/1706.03762v7", "1706.03762v7", "1706.03762", "v7"],
  ["https://arxiv.org/abs/1706.03762", "1706.03762", "1706.03762", null],
  [
    "https://www.arxiv.org/pdf/2505.04421V2.pdf",
    "2505.04421v2",
    "2505.04421",
    "v2",
  ],
  [
    "https://export.arxiv.org/html/1706.03762v7",
    "1706.03762v7",
    "1706.03762",
    "v7",
  ],
  [
    "https://arxiv.org/pdf/hep-th%2F9901001v2.pdf",
    "hep-th/9901001v2",
    "hep-th/9901001",
    "v2",
  ],
  [
    "https://arxiv.org/abs/math.GT/0309136v3",
    "math.GT/0309136v3",
    "math.GT/0309136",
    "v3",
  ],
  [" https://arxiv.org/abs/cs/9901001 ", "cs/9901001", "cs/9901001", null],
]) {
  test(`normalizes source identity: ${input}`, () => {
    assert.deepEqual(
      { ...parsePaperUrl(input) },
      { externalId, requestedVersion: version, versionedId },
    );
  });
}

for (const input of [
  "",
  null,
  42,
  "1706.03762", // This extension handles page links, not arbitrary text input.
  "http://arxiv.org/abs/1706.03762",
  "javascript:alert(1)",
  "https://evil.example/abs/1706.03762",
  "https://arxiv.org.evil.example/abs/1706.03762",
  "https://arxiv.org@evil.example/abs/1706.03762",
  "https://user:password@arxiv.org/abs/1706.03762",
  "https://arxiv.org/abs/1706.03762?redirect=1",
  "https://arxiv.org/abs/1706.03762#section",
  "https://arxiv.org/abs/1706.03762v0",
  "https://arxiv.org/abs/1706.03762v01",
  "https://arxiv.org/abs/1700.03762",
  "https://arxiv.org/abs/1713.03762",
  "https://arxiv.org/abs/1706.03762/extra",
  "https://arxiv.org/pdf/../abs/1706.03762",
  "https://arxiv.org/pdf/%2e%2e/abs/1706.03762",
  "https://arxiv.org/pdf/.%2e/abs/1706.03762",
  "https://arxiv.org/pdf/%2e./abs/1706.03762",
  "https://arxiv.org/abs/hep-th%252F9901001v2",
  "https://arxiv.org/abs/1706.03762%5cother",
  "https://arxiv.org/abs/%E0%A4%A",
  "https://arxiv.org/abs/" + "1".repeat(2048),
]) {
  test(`rejects unsupported or ambiguous input: ${String(input).slice(0, 100)}`, () => {
    assert.equal(parsePaperUrl(input), null);
  });
}

function redirect(url, parameter = "url") {
  return `https://www.google.com/url?${parameter}=${encodeURIComponent(url)}`;
}

test("Google redirects are bounded, validated, and never forwarded as source data", () => {
  const source = "https://arxiv.org/pdf/1706.03762v7.pdf";
  for (const key of ["url", "q"]) {
    assert.equal(
      parsePaperUrl(redirect(source, key)).versionedId,
      "1706.03762v7",
    );
  }
  assert.equal(
    parsePaperUrl(
      `/url?q=${encodeURIComponent(source)}`,
      "https://www.google.com",
    ).versionedId,
    "1706.03762v7",
  );
  let nested = source;
  for (let i = 0; i < 4; i++) nested = redirect(nested);
  assert.equal(parsePaperUrl(nested).versionedId, "1706.03762v7");
  assert.equal(parsePaperUrl(redirect(nested)), null);
  assert.equal(
    parsePaperUrl(redirect("https://evil.example/abs/1706.03762")),
    null,
  );
  assert.equal(parsePaperUrl("https://www.google.com/url?q="), null);
  assert.equal(
    parsePaperUrl(redirect("https://arxiv.org/abs/1706.03762v0")),
    null,
  );
});

for (const [language, locale] of [
  ["zh", "zh"],
  ["zh-CN", "zh"],
  ["zh-TW", "zh"],
  ["zh-Hant-HK", "zh"],
  ["ZH-hans", "zh"],
  ["en-US", "en"],
  ["ja-JP", "en"],
  ["fr-FR", "en"],
  ["", "en"],
  ["zhish", "en"],
]) {
  test(`browser language ${language || "(missing)"} selects ${locale}`, () => {
    assert.equal(browserLocale({ language }), locale);
    const identity = parsePaperUrl("https://arxiv.org/abs/1706.03762v7");
    assert.equal(
      paperUrl(identity, locale),
      `https://gradwiser.com/${locale === "zh" ? "zh/" : ""}abs/1706.03762v7`,
    );
    assert.equal(
      linkCopy(locale).text,
      locale === "zh" ? "与论文 AI 对话" : "AI Chat with Paper",
    );
    assert.match(linkCopy(locale).hint, /GradWiser/);
    assert.equal(
      linkCopy(locale).hint,
      locale === "zh"
        ? "GradWiser · 打开论文摘要"
        : "GradWiser · Open the paper abstract.",
    );
    assert.doesNotMatch(
      `${linkCopy(locale).label} ${linkCopy(locale).hint}`,
      /登录|sign.in/i,
    );
  });
}

test("the primary browser language wins, with languages[0] as a fallback only", () => {
  assert.equal(
    browserLocale({ language: "en-US", languages: ["en-US", "zh-CN"] }),
    "en",
  );
  assert.equal(browserLocale({ languages: ["zh-TW", "en"] }), "zh");
  assert.equal(browserLocale(), "en");
});

test("public destinations retain old-style slashes and unversioned identity", () => {
  assert.equal(
    paperUrl(parsePaperUrl("https://arxiv.org/abs/hep-th/9901001v2"), "zh"),
    "https://gradwiser.com/zh/abs/hep-th/9901001v2",
  );
  assert.equal(
    paperUrl(parsePaperUrl("https://arxiv.org/abs/1706.03762"), "en"),
    "https://gradwiser.com/abs/1706.03762",
  );
  assert.equal(paperUrl({ versionedId: "../evil" }, "en"), null);
  assert.equal(paperUrl(null, "zh"), null);
});

test("manifest stays permission-free and loads the pure link helper first", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "manifest.json"), "utf8"),
  );
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.content_scripts.length, 1);
  const script = manifest.content_scripts[0];
  assert.deepEqual(script.matches, [
    "https://arxiv.org/abs/*",
    "https://www.arxiv.org/abs/*",
    "https://www.google.com/search*",
  ]);
  assert.deepEqual(script.js, ["src/paper-link.js", "src/content.js"]);
  for (const resource of [...script.js, ...script.css]) {
    assert.ok(readFileSync(path.join(root, resource), "utf8"));
  }
  const runtime = script.js
    .map((file) => readFileSync(path.join(root, file), "utf8"))
    .join("\n");
  assert.doesNotMatch(
    runtime,
    /\/papers\/import|utm_source|data-gradwiser-import|window\.open|\bfetch\s*\(/,
  );
});
