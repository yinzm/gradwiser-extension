# GradWiser for arXiv

**English** · [简体中文](README.zh-CN.md)

**Found an arXiv paper? Open it in GradWiser with one click.**

GradWiser is a workspace for reading papers, annotations, and paper-grounded AI
conversations. This lightweight Chrome extension adds an **AI Chat with Paper**
link to arXiv abstract pages and supported arXiv results on Google Search, so
you do not have to copy and paste the paper URL into GradWiser.

The link opens the paper's **public abstract page in a new tab**. Reading the
abstract does not require sign-in. PDF reading, AI chat, and authentication for
private actions are handled by the [GradWiser website](https://gradwiser.com),
not by the extension. Clicking the link does **not** automatically send an AI
request or save the paper to a private library.

> **Current version: 0.1.0.** Install locally using the steps below.
> Google support is partial: some anonymous/incognito results use opaque
> redirects that cannot be recognized. See [supported pages](#supported-pages-and-limitations).

## Meet GradWiser: from papers to research ideas

**Discover papers, understand the details, and turn reading into your own
research.** [GradWiser](https://gradwiser.com) brings these steps into one
workspace for graduate students, PhD students, and researchers—especially those
following AI and computer science.

| Main-site capability | How it helps |
| --- | --- |
| **Paper and code discovery** | Browse new arXiv papers, Hugging Face Daily Papers, and research repositories from GitHub Trending. |
| **Bilingual reading** | Read original papers alongside translations. Original reading and bilingual translation are available free without registration. |
| **Paper-grounded AI conversations** | Ask about contributions, concepts, equations, and methods; follow page citations back to the source to check explanations. |
| **Private notes and annotations** | Highlight key passages, capture questions and ideas, and keep your notes and uploaded documents private. Export notes and uploaded documents for free. |
| **Related-paper exploration** | Explore papers around a research topic and connect concepts and methods to build a literature-reading path. |
| **Conference radar** | Find AI/CS conferences and submission deadlines to help plan your next paper. |

A typical workflow: **discover a paper → read and ask questions → annotate
important passages → connect related work → develop a research idea**.
This extension is the shortcut into that workflow, not a replacement for the
website. Saving notes and other private actions require sign-in; AI explanations
and translations should always be checked against the original paper.

**[Explore GradWiser](https://gradwiser.com)** ·
[Try a paper](https://gradwiser.com/abs/1706.03762v7) ·
[Browse conference deadlines](https://gradwiser.com/conferences)

You can try the website without installing the extension: paste an arXiv URL
or paper ID into the homepage and choose **Open Paper**.

## What the extension does

- **On arXiv:** adds the entry at the top of the **Access Paper** list.
- **On Google:** adds a compact chat entry beside recognized arXiv result
  titles; on narrow layouts it moves below the title.
- **Keeps paper versions:** `1706.03762v7` opens that exact version. A link
  without a version stays unversioned for GradWiser to resolve.
- **Supports old arXiv IDs:** for example, `hep-th/9901001v2`.
- **Uses your browser language:** Chinese text and destination for `zh`/`zh-*`;
  English for other languages. This does not depend on the search language.
- **Behaves like a normal link:** keyboard access, middle-click, and copying
  the destination are supported. Original website links remain unchanged.

## See it in action

The screenshots below show the English interface. Entry text and destinations
follow your browser's primary language.

### 1. Start from an arXiv paper

The **AI Chat with Paper** link appears first in **Access Paper**, alongside
arXiv's original PDF and HTML links.

![arXiv abstract page with the GradWiser AI Chat with Paper entry at the top of Access Paper](docs/images/01-arxiv-en.png)

### 2. Open a paper from Google Search

Recognized arXiv results get a compact entry beside the title. This example
shows a supported layout; opaque `/goto` links remain unsupported.

![Google Search with GradWiser chat entries beside two recognized arXiv result titles](docs/images/02-google-en.png)

### 3. Continue in GradWiser

Clicking opens the public abstract with the main site's AI assistant alongside
it. Read the abstract, then choose whether to ask a question or explore notes
and related papers. The screenshot shows the starting interface, not a generated
answer; the extension does not automatically send a question.

![GradWiser public abstract page with the AI assistant, suggested questions, Notes and Related tabs](docs/images/03-gradwiser-en.png)

**[Try this paper in GradWiser](https://gradwiser.com/abs/1706.03762v7)**

## Install locally in Chrome

No build, Node.js, or dependency installation is needed to use the extension.

1. Download this repository using **Code → Download ZIP** on GitHub and extract
   it. Alternatively, clone it:

   ```sh
   git clone https://github.com/yinzm/gradwiser-extension.git
   ```

2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted/cloned folder containing
   `manifest.json`—not the ZIP file or its parent folder.
5. Open a supported page. If it was already open, refresh it.

After updating the files, click **Reload** on the extension's card and refresh
any source pages. Keep the installed folder in place; Chrome reads it directly.

## Use it

### From arXiv

1. Open an abstract page, such as
   [Attention Is All You Need, v7](https://arxiv.org/abs/1706.03762v7).
2. Find **Access Paper** and click **AI Chat with Paper**
   (or **与论文 AI 对话**).
3. A new tab opens the same paper's GradWiser abstract. Continue reading or
   exploring the main site's features from there.

### From Google Search

1. Search on `https://www.google.com/search` for a paper—for example,
   `site:arxiv.org attention is all you need`.
2. Click the chat entry beside a recognized arXiv result title.
3. If there is no entry, the result may use an unsupported redirect or layout.
   You can instead open the result's arXiv abstract page and use the entry there.

### Language and destinations

| Browser's primary language | Entry text | Destination |
| --- | --- | --- |
| `zh`, `zh-CN`, `zh-TW`, etc. | 与论文 AI 对话 | `https://gradwiser.com/zh/abs/<id>` |
| Other or unavailable | AI Chat with Paper | `https://gradwiser.com/abs/<id>` |

For example, a Chinese-language browser opens
`https://gradwiser.com/zh/abs/1706.03762v7` from the versioned example above.
There is no language setting inside the extension. Refresh the source page
when changing the browser language.

## Supported pages and limitations

| Page or link type | Support |
| --- | --- |
| HTTPS abstract pages on `arxiv.org` and `www.arxiv.org` | Adds an entry |
| Organic arXiv results on `www.google.com/search` | Recognized links and safe title layouts only |
| arXiv `abs`, `pdf`, or `html` links within Google results | Identity parsing only; includes `export.arxiv.org` links |
| arXiv PDF/HTML pages and Chrome's PDF viewer | No entry |
| Other Google domains, search engines, or paper sources | Not supported |

Direct source links and valid Google `/url` redirects are parsed locally.
Some Google results, including the anonymous layout observed during acceptance,
use `/goto?url=<opaque token>`. **These results do not get an entry in 0.1.0.**
The extension does not request redirects, decode opaque tokens, or guess a
paper's identity from its title or a shortened display URL. Unknown unsafe
layouts are also skipped rather than rearranged.

Incognito mode additionally requires **Allow in incognito** in Chrome's
extension details. Enabling it does not remove the Google redirect limitation.
The arXiv anonymous abstract flow has been verified through user-assisted
screenshots; the observed Google anonymous flow has not passed acceptance.
See [CHANGELOG.md](CHANGELOG.md) for the evidence and outstanding checks.

## Privacy and security

- Before a click, the extension makes **no network requests**. It only processes
  links and DOM needed to recognize and place an entry.
- No account/cookie access, persistent storage, telemetry, background worker,
  API keys, or runtime dependencies. It does not collect surrounding page text
  or Google search queries.
- Destinations use a fixed GradWiser HTTPS domain, validated paper identities,
  and no source/tracking parameters. New tabs use `noopener noreferrer`.
- After clicking, the browser loads GradWiser normally. The website's network
  activity and authentication are separate from the extension's behavior.

The content scripts need access to the supported source pages to add links;
Chrome may describe that access as permission to read and change site data.
See [SECURITY.md](SECURITY.md) for trust boundaries and private vulnerability
reporting guidance. Do not post credentials, session data, or private content
in public issues.

## Development and contributions

The extension uses native JavaScript and Chrome Manifest V3. Development needs
**Node.js 22+ and pnpm**; users loading the extension do not need them.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

| File | Responsibility |
| --- | --- |
| `manifest.json` | Page matches and resource loading |
| `src/paper-link.js` | URL validation, arXiv identity, locale, and destination |
| `src/content.js` | Page injection, layout alignment, and dynamic lifecycle |
| `src/content.css` | arXiv entry and scoped Google grid styles |
| `tests/` | Node/jsdom regression tests |

Google link styles live in a Shadow Root. Tests cover URL/locale contracts,
manifest resources, and DOM lifecycle; jsdom is a development dependency and is
not shipped with the extension. Tests do not replace real browser acceptance:
see the [public-entry contract](docs/first-release.md).

For bug reports, include browser/extension versions, reproduction steps, and
whether the issue occurs in incognito. Share only the minimal sanitized evidence
needed; omit personal information, search history, and opaque redirect tokens.
Never contribute credentials, user data, QA artifacts, or private main-site code.
A store package should contain only the manifest, its referenced runtime files,
and any declared icons—not the whole development checkout.

## Repository scope and license

**This repository contains the browser extension only. The GradWiser main site
remains a separate closed-source service.** Its source, private APIs, and
credentials are neither included nor required for extension development/tests.
Publishing this repository does not publish or license the main site's code.

The extension code and accompanying documentation are licensed under the
[MIT License](LICENSE). You may use, modify, and redistribute them, including
commercially, provided you retain the copyright and license notices.

This license does not cover the closed-source main site or grant rights to
GradWiser names, logos, or trademarks. Third-party logos, paper text, and website
content shown in screenshots retain their respective owners' rights.
`package.json`'s `private: true` prevents accidental npm publication; it does not
control GitHub visibility.
