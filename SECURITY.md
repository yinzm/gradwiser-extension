# Security

## Scope and trust boundaries

This repository contains only the standalone browser extension. GradWiser's
main site is a separate closed-source service; no main-site source, deployment
configuration, credentials, database or private API access is required here.
Public domains, public page routes and arXiv identity rules are not secrets.

- The extension constructs links to a fixed HTTPS GradWiser public abstract
  page from locally validated arXiv identities. It does not authenticate,
  authorize private actions, import papers, execute AI requests or call APIs.
- Page links, DOM attributes and redirect parameters are untrusted. Accept
  only supported HTTPS sources with standard ports, valid identities and
  unambiguous bounded redirects. Skip opaque Google `/goto` tokens.
- Render with safe DOM APIs and keep `noopener noreferrer` on new-tab links.
  There are no runtime dependencies, background worker, telemetry, storage,
  account/cookie access or extension-originated requests before clicking.
- Opening the destination causes ordinary browser navigation. Subsequent
  network activity, cookies and private-action authentication belong to the
  main site, not this extension's pre-click behavior.
- Content-script isolation is not a trusted user interface: a host page can
  modify its own DOM, including injected links. Do not add credentials or
  privileged operations to this interface.
- Source secrecy is not an authorization boundary. The main site must enforce
  authentication, user-data isolation, input validation and rate limits on the
  server even when callers know its public routes. The extension cannot prove
  or enforce those server-side controls.

## Contributing and packaging

Never commit real `.env` files, keys, browser/session data, databases, full page
captures, opaque redirect tokens, QA screenshots or copies of main-site code.
Use public paper identities and synthetic fixtures for regression tests.
`.gitignore` helps prevent accidents; it does not detect all secrets, remove
tracked files or erase history. Review the staged diff before committing.

A store ZIP should contain only `manifest.json`, its referenced `src/` files,
and any declared icons. Do not zip the whole checkout: exclude `.git`,
`node_modules`, local data, development configuration and QA artifacts.

Run `pnpm check`, `pnpm test` and `git diff --check`. Browser acceptance must
use the actual installed extension; Node/jsdom tests and an authenticated
session do not replace anonymous end-to-end checks.

Before changing repository visibility, review **all published Git history**,
author identities, branches/tags, releases, assets and hosting configuration.
Author names and emails remain public even if source files are cleaned up.
Removing a sensitive file in a later commit does not remove earlier copies.
If credentials are exposed, revoke/rotate them first; coordinate any history
rewrite separately. Do not force-push or change visibility without approval.

## Reporting vulnerabilities

Do not publish credentials, session data, user content or exploit details in a
public issue. If the repository has GitHub private vulnerability reporting
enabled, use the Security tab's private reporting flow. Otherwise ask the
maintainer for a private contact channel without including sensitive details.
Never perform unauthorized tests against the live service or other users.

## Review limitations

The current source/history review did not find real credentials or main-site
source. Pattern-based scanning is not proof that every secret or vulnerability
has been found. Existing history still mentions a main-site implementation path;
that is not source disclosure but remains visible in older commits. Rewriting
history, changing Git author identities, enabling hosting security features,
choosing a license and changing visibility require separate decisions.
