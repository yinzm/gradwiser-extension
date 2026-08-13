# GradWiser Browser Extension

This is a standalone Chrome Manifest V3 extension. It adds an **Open in
GradWiser** entry point to supported arXiv abstract pages and to recognized
arXiv results on Google Search.

The extension is deliberately small: it never imports papers, reads account
data, or calls AI providers itself. A user click opens GradWiser with the
canonical arXiv URL; GradWiser then authenticates the user, performs the
existing idempotent import, and opens the private paper workspace.

## Current scope

- `arxiv.org/abs/*` and `www.arxiv.org/abs/*`
- `www.google.com/search*` entries whose destination is a valid arXiv paper
- Current-format and legacy arXiv identifiers, including explicit versions
- No API keys, no broad host permissions, no PDF replacement, and no page data
  transmitted before the user clicks

Direct arXiv PDF viewer injection is intentionally deferred. Chrome generally
renders PDFs in its own viewer, where normal webpage content scripts are not a
reliable UI surface. The first release starts from the arXiv abstract page,
which reliably carries the paper identity and version.

## Local loading

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this directory.
4. Open an arXiv abstract page or a Google result containing an arXiv paper.

The destination route (`https://gradwiser.com/papers/import?source=…`) is
implemented in the GradWiser app. It preserves the source URL through sign-in,
calls the existing authenticated import API, then opens the private reader.

## Repository boundary

This folder is intentionally independent from the `gradwiser/` production app.
It will maintain its own manifest, release notes, browser-store assets, and
extension tests. The main app only needs a narrowly scoped, authenticated
import-handoff route.
