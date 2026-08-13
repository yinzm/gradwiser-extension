# First-release contract

## Promise

When a researcher finds an arXiv paper, one click opens its private GradWiser
workspace so they can read, annotate, ask paper-grounded questions, and use it
as a seed for later research.

## Browser responsibilities

1. Parse a supported arXiv URL into a canonical `https://arxiv.org/abs/<id>`
   URL while preserving its explicit version.
2. Render a non-invasive, keyboard-accessible entry point as the first action
   in arXiv's `Access Paper` list and after the actual title of a recognized
   Google organic result. The Google action stays in that result's normal
   document flow and uses a small Shadow Root so its text and focus state
   cannot inherit result-card styles.
3. Open the GradWiser import-handoff route only after a deliberate click.
4. Avoid inspecting or transmitting the surrounding page, Google query, or
   user account data.

## Main-site handoff requirements

`/papers/import?source=<canonical-arxiv-url>` must:

1. Validate `source` with the same server-safe arXiv parser used by the import
   API.
2. Preserve the URL across sign-in and resume automatically after login.
3. Call the authenticated existing paper-import API exactly once per attempt.
4. Redirect to the returned private reader URL, including its bootstrap cache.
5. Display a clear failure state with a retry action; it must not expose paper
   data or a reader URL from another user.

## Deferred work

- Direct Chrome PDF viewer controls
- Cross-paper comparison and external-page AI chat
- Non-arXiv paper sources
- Bookmarks, folders, notes, and all persistent reading actions inside the
  extension
- Google domains beyond `www.google.com`; add them only after localized visual
  verification
