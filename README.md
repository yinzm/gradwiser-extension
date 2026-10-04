# GradWiser Browser Extension

A standalone Chrome Manifest V3 extension that adds **Open in GradWiser** to
arXiv abstract pages and recognized arXiv results on Google Search.

A click opens the paper's **public abstract page** directly. No sign-in or
private import is required to open the abstract. GradWiser handles metadata,
version resolution, PDF reading, and authentication for private actions.
The extension does not call APIs, read accounts, or create reading state.

## Public links and language

The browser's primary language selects both the entry text and destination:

| Browser language                                | Entry text          | Destination                         |
| ----------------------------------------------- | ------------------- | ----------------------------------- |
| `zh`, including `zh-CN`, `zh-TW`, and `zh-Hant` | 在 GradWiser 中打开 | `https://gradwiser.com/zh/abs/<id>` |
| Any other language or an unavailable preference | Open in GradWiser   | `https://gradwiser.com/abs/<id>`    |

Explicit versions are preserved: `1706.03762v7` opens that version. An ID
without a version stays unversioned so the main site can resolve the latest
version. Legacy IDs retain their slash, e.g. `/zh/abs/hep-th/9901001v2`.
The links have no source, tracking, or import parameters.

## Supported pages

- HTTPS abstract pages on `arxiv.org` and `www.arxiv.org`.
- `https://www.google.com/search*` (the `/search` page), for recognized arXiv
  result titles inside the organic results area (`#rso`).
- Search-result source links may use `arxiv.org`, `www.arxiv.org`, or
  `export.arxiv.org`, with `abs`, `pdf`, or `html` paths. Valid Google `/url`
  redirects are unwrapped locally with bounded depth.

The parser follows the main site's public arXiv identity rules: HTTPS, valid
current/legacy IDs, positive explicit versions, and no credentials, source
query/fragment, or ambiguous encoding. Supporting PDF/HTML result links does
**not** mean injecting into PDF/HTML pages.

The arXiv link is the first action in `Access Paper`. Google links use a Shadow
Root for styling and remain in their result's normal document flow. Dynamic
result updates reconcile changed targets, removed entries, and replaced result
containers. Unknown unsafe layouts are skipped rather than injecting into an
unrelated result.

## Local loading

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this directory.
3. Visit an arXiv abstract page or a Google search with arXiv results.
4. After changing code or the manifest, reload the extension and refresh the
   target page. To check both languages, change the browser language and
   refresh; the runtime also responds to `languagechange`.

No build is needed. `src/paper-link.js` provides identity, destination, and
language functions; `src/content.js` adapts the supported pages. The manifest
loads these native scripts in order. `src/content.css` styles arXiv links;
Google link styles live in their Shadow Root.

## Development checks

Use Node 22+ and pnpm for test dependencies only:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

Tests use Node's built-in runner and jsdom, covering URL/locale contracts,
manifest resources, and DOM lifecycle regressions. jsdom is not shipped with
the extension. These checks do not replace real browser acceptance; see the
[public-entry contract](docs/first-release.md).

## Boundaries

No runtime dependencies, background worker, API keys, account access, storage,
telemetry, or additional permissions. No extension-originated network requests
before clicking. Native links support keyboard access, middle-click, and
copying the destination, with `noopener noreferrer` isolation.

This is an independent repository, not a subpackage of the GradWiser app. The
extension uses current public routes only, with no old import-protocol fallback.
PDF viewer injection, other search engines/Google domains, non-arXiv sources,
and private management features are outside the current scope.
