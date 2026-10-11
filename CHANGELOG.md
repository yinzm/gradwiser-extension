# Changelog

## Unreleased — public-source preparation

- Make extension documentation and contributor instructions self-contained;
  remove current references to private main-site repository/source paths.
- Document that the main site remains closed source and that public routes
  are not an authorization boundary. Add security reporting, sensitive-file
  handling and release-package guidance in `SECURITY.md`.
- Ignore common local environment files, keys, databases and QA artifacts.
- Reject nonstandard source/redirect ports, control characters, oversized
  identities and duplicate/conflicting Google redirect destinations; add
  regression tests. Opaque `/goto` results remain unsupported.
- Add English/Chinese user guides, main-site capability introductions and three
  reviewed product screenshots. Add extension icons and store listing drafts.
- No new permissions, network calls, dependencies or manifest-version changes.

## 0.1.0 — unreleased baseline

This records the current extension before work on anonymous Google `/goto`
results. It is not a store release or a claim of complete acceptance.
The manifest version remains `0.1.0`.

### Changes

- `b4c770b`: open localized public GradWiser abstract pages directly, without
  the old import handoff or tracking parameters; preserve explicit arXiv versions.
- `a57fa3a`: align compact Google chat entries with the title's first line,
  stack entries on narrow layouts, and reconcile resize and dynamic DOM changes.
- Support current and legacy arXiv identities, direct abs/pdf/html result links,
  and locally validated Google `/url` redirects. Injection remains limited to
  supported arXiv abstract pages and `www.google.com/search`.
- No background worker, runtime dependencies, account access, storage,
  telemetry, or extension-originated requests before a click.

### Acceptance evidence

- Syntax checks and all 61 Node/jsdom tests passed. These are not browser
  end-to-end acceptance.
- Ego Lite loaded and reloaded this repository's actual extension. Checked real
  arXiv pages and a signed-in Google result layout: placement, long titles,
  scrolling, simulated narrow viewports, keyboard focus/Enter, and middle-click.
- Synthetic mutations on the real Google page checked target changes,
  entry repair, and result-root removal/restoration without duplicate entries.
- Chinese was the native browser language; English was a CDP language override,
  not an independently installed English-language environment.
- No requests to GradWiser were observed on the checked source-page reloads
  before clicking. This does not constitute exhaustive network auditing.
- The user operated an incognito window and provided screenshots confirming
  arXiv `1706.03762v7` opened `/zh/abs/1706.03762v7`, preserving the version and
  showing the public abstract without a login detour. This was screenshot
  review, not Agent-controlled anonymous automation.

### Known issue / outstanding acceptance

- Anonymous Google results supplied by the user use `/goto?url=<opaque token>`.
  Diagnostics confirmed `www.google.com/search`, a result root and headings,
  but zero injected entries. The parser supports `/url`, not opaque `/goto`
  tokens. The anonymous Google click flow has therefore not passed acceptance.
- Investigate reliable original URLs in the same result's DOM before adding any
  fallback. Do not request the redirect, decode opaque tokens, infer identity
  from titles/truncated display URLs, or broaden extension permissions.
- Native English-browser acceptance, native zoom, the context-menu copy-link
  workflow, and acceptance of the final upload ZIP remain outstanding.
- Store icons, screenshots, listing copy and privacy disclosures still need
  preparation. Do not upload development dependencies or QA artifacts.
