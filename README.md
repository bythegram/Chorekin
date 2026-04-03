# default-landing-page

A minimal, static "Hello World" landing page. No frameworks, no build step, no external dependencies at runtime — just HTML and CSS served from the `public/` directory.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 14 (only needed for the optional dev server)
- A modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/bythegram/default-landing-page.git
cd default-landing-page

# Install the optional dev server
npm install
```

### Running locally

```bash
npm start
# → serving at http://localhost:3000
```

Alternatively, use any static HTTP server:

```bash
npx serve public
python3 -m http.server 3000 --directory public
```

---

## Project Structure

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
├── package.json     # npm metadata and dev-server script
└── README.md        # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styling | CSS3 (Flexbox, `clamp()` fluid sizing) |
| Dev server | [`serve`](https://github.com/vercel/serve) (optional, any static server works) |

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-improvement`)
3. Commit your changes (`git commit -m 'Add my improvement'`)
4. Push to the branch (`git push origin feature/my-improvement`)
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.
