# Public-entry contract

## Promise

When a researcher finds an arXiv paper, one click opens its public GradWiser
abstract page. Reading starts without a login detour; GradWiser owns metadata
resolution, switching to PDF, and authentication for private actions.

## Extension responsibilities

1. Parse a supported source link locally into an arXiv identity, following
   the main site's current public `src/modules/refactor/arxiv-id.ts` rules.
   Preserve explicit versions; never invent a version for an unversioned ID.
2. Select `zh` for the browser's primary `zh`/`zh-*` language, and `en` for
   other or missing languages. Use `navigator.language`, falling back to the
   first `navigator.languages` entry only when the primary value is missing.
   Page language and the Google query do not determine the choice.
3. Generate only `https://gradwiser.com/zh/abs/<id>` or
   `https://gradwiser.com/abs/<id>`. Do not add source or tracking parameters.
4. Render a localized native link: `AI Chat with Paper` or `与论文 AI 对话`,
   with a matching accessible name, visible keyboard focus, `_blank`, and
   `noopener noreferrer`. Its tooltip identifies GradWiser and explains that
   the link opens the abstract. Neither tooltip nor accessible name includes a
   login reminder; authentication remains the main site's responsibility.
5. Place the arXiv link first in `Access Paper`. On Google, use a compact
   chat-icon entry beside the title's first visible line, outside transformed
   ancestors and in the same result's normal flow. Preserve the original
   title/source subtree; apply a reversible, scoped grid only to single-content
   wrappers. Let long titles wrap, and stack below the title at viewport widths
   under 600px or wrapper widths under 480px. Keep link styling in a Shadow Root
   and reconcile alignment after resize or font/layout changes.
6. Batch mutations and reconcile href changes, result replacement/removal,
   externally removed entries, and browser back/forward restoration. Do not
   create duplicate entries or trigger a self-observing mutation loop.
7. Make no API calls, private imports, account checks, storage writes, or
   prefetches. Do not collect or transmit surrounding text or search queries.

## Main-site boundary

The public `/abs/<id>` and `/zh/abs/<id>` routes resolve the identity and
present the abstract without mandatory sign-in. Versions, PDF availability,
loading/error states, and authentication for private actions belong to the
main site. The extension must not reproduce or bypass those rules.

No old import handoff or fallback is retained in the extension. Main-site
private APIs remain the main application's responsibility and are not removed
merely because the extension no longer uses them.

## Acceptance checklist

- Run `pnpm check`, `pnpm test`, and `git diff --check`; check manifest matches,
  script ordering, referenced resources, and lack of new permissions.
- Load/reload the actual extension in Chrome/Chromium, then refresh source
  pages. Confirm no extension runtime errors.
- On real arXiv and Google pages, check English and Chinese text/destinations,
  current/legacy IDs, explicit/unversioned links, keyboard operation,
  middle-click, copying links, narrow viewports, zoom, and scrolling. Check
  first-line alignment for short/multiline titles, no overlap with metadata,
  narrow-screen stacking, and restoration of the original source layout.
- Check Google results contain one entry per recognized title, not ads or
  unrelated headings. Exercise href updates, result removal/replacement,
  entry removal/restoration, and no-match results. Synthetic mutations are
  regression checks, not evidence that every Google layout is supported.
- Before clicking, verify no extension-originated network requests. After a
  click, verify the actual public abstract destination and no login detour.
  Do not perform private actions or create user data as part of this check.
- Report browser-language overrides or DOM simulations separately from tests
  with the installed extension. Do not claim anonymous acceptance based only
  on an existing logged-in session.

## Out of scope

- Direct Chrome PDF viewer controls or injection into arXiv PDF/HTML pages
- Other paper sources, Google domains, or search engines
- Cross-paper comparison, external-page AI chat, bookmarks, folders, and notes
- Background services, account integration, persistent settings, and telemetry
