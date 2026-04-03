# GitHub Copilot Instructions — default-landing-page

## Project Overview

**default-landing-page** (`default-landing-page`) is a minimal, static "Hello World" landing page. No frameworks, no build step, no external dependencies at runtime — just HTML and CSS served from the `public/` directory.

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Markup | Plain HTML5 — a single `index.html` file |
| Styling | Vanilla CSS3 — a single `style.css` file (Flexbox, `clamp()`) |
| Dev server | `serve` npm package (optional; any static server works) |

There is **no framework, no transpiler, no bundler, and no build step**. The entire app ships as-is.

---

## Repository Layout

```
default-landing-page/
├── public/
│   ├── index.html   # HTML shell — single centred "Hello World" heading
│   ├── style.css    # Minimal reset + flexbox layout
│   └── icons/
│       ├── favicon.ico
│       ├── apple-touch-icon.png
│       ├── icon-192.png
│       ├── icon-192-maskable.png
│       ├── icon-512.png
│       └── icon-512-maskable.png
├── package.json     # npm metadata; `npm start` runs `serve public`
├── .github/
│   └── copilot-instructions.md  # This file
├── LICENSE          # MIT License
└── README.md        # Project documentation
```

---

## Key Source Files

### `index.html`

Minimal HTML5 shell with a single full-viewport layout zone:
- `<main>` — flexbox container that centres the `<h1>Hello World</h1>` heading both horizontally and vertically
- Favicon and apple-touch-icon `<link>` tags point to `icons/`

### `style.css`

- Box-sizing reset on `*`, `*::before`, `*::after`
- `html` and `body` set to `height: 100%` with zero margin/padding
- `main` uses `display: flex` with `align-items: center; justify-content: center; height: 100%`
- `h1` uses `clamp(2rem, 8vw, 5rem)` for fluid sizing

---

## Coding Conventions

- **No JavaScript** — the page has no runtime scripts
- **No external dependencies at runtime** — do not add npm packages that are loaded in the browser
- **No framework** — no React, Vue, Angular, jQuery, etc.
- **No build step** — do not introduce Webpack, Rollup, Babel, TypeScript, or any compilation step
- **Static only** — keep the app deployable as a plain static site (no server-side rendering, no backend)

---

## Running the Project

```bash
npm install   # installs the `serve` dev server (one-time)
npm start     # serves at http://localhost:3000
```

Open `http://localhost:3000` in your browser.
