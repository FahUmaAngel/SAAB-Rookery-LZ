# AGENTS.md — SAAB Rookery-LZ (C2 STRATOS Tactical Dashboard)

## Project Overview

Static multi-page tactical dashboard for SWAF C2 (Command & Control) STRATOS.
No build system, no bundler, no package.json — pure HTML + vanilla JavaScript + Tailwind CSS via CDN.

## Project Structure

```
├── index.html                 # Launcher — redirects to map-view.html
├── map-view.html              # Main tactical map (primary entry point)
├── tactical-map.html          # Detailed tactical map view
├── Asset-ready.html           # Asset readiness dashboard
├── Sensor-Fusion.html         # Sensor fusion display
├── sensor_map.html            # Sensor map overlay
├── comms.html                 # Communications & SIGINT panel
├── logistics.html             # Logistics management
├── mission_logs.html          # Mission logs & intel
├── shared-components.js       # Shared UI components (header, sidebar, SPA nav)
├── ai-system.js               # AI threat-assessment engine (Scan-Detect-Suggest-Protect-Report)
├── tailwind.config.js         # Tailwind CSS custom theme configuration
├── airplane-shadow.svg        # SVG asset
├── styles/
│   └── global.css             # Global CSS (hex-bg, radar-sweep, scrollbars)
└── .vscode/
    └── settings.json          # VS Code Snyk config
```

## Build / Run / Test Commands

### Running Locally

No build step. Serve the directory with any static HTTP server:

```bash
# Python
python3 -m http.server 8000

# Node (npx)
npx -y serve .

# VS Code Live Server extension also works
```

Open `http://localhost:8000/map-view.html` (or port shown by your server).
`index.html` auto-redirects to `map-view.html`.

### Linting

No linter is configured. If adding one:

```bash
npx -y eslint --no-eslintrc --env browser --global tailwind,SharedComponents,AISystem ./*.js
```

### Testing

No test framework exists. There are no automated tests.
Manual verification: open each `.html` page in a browser and confirm rendering.

### Single-File Validation

```bash
# Validate HTML
npx -y html-validate <file>.html

# Check JS syntax
node --check <file>.js
```

## Technology Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Markup     | HTML5, semantic elements (`<main>`, `<section>`, `<header>`, `<nav>`) |
| Styling    | Tailwind CSS v3 via CDN (`cdn.tailwindcss.com?plugins=forms,container-queries`) |
| JavaScript | Vanilla ES6+ (no framework, no modules, no bundler) |
| Fonts      | Google Fonts — Inter, Space Grotesk, Material Symbols Outlined |
| Icons      | Material Symbols Outlined (variable font) |

## Code Style Guidelines

### HTML Pages

- Every page uses `<html class="dark" lang="en">` — dark mode is always on.
- Each page includes the Tailwind CDN script and the local `tailwind.config.js` in `<head>`.
- Pages must contain `<div id="header-placeholder">` and `<div id="sidebar-placeholder">`.
- Main content goes inside `<main>` wrapped by `<div id="main-wrapper" class="mt-12 ...">`.
- Load `shared-components.js` via `<script>` at the **end of `<body>`** (not in `<head>`).
- Page-specific `<style>` blocks go in `<head>`, after the Tailwind CDN script.

### JavaScript

- **No module system** — all JS uses global `const` object literals (e.g., `SharedComponents`, `AISystem`).
- Attach to `window` explicitly: `window.AISystem = AISystem;`.
- Use arrow functions for methods: `scan: (data) => { ... }`.
- Use template literals for HTML generation (backtick strings).
- Event communication uses `CustomEvent` + `window.dispatchEvent` / `window.addEventListener`.
- DOM queries use `document.getElementById()` and `document.querySelectorAll()`.
- Async operations use `async/await` with `try/catch` error handling.
- Console logging follows the pattern: `console.log("[MODULE:PHASE] message", data);`.
- No semicolons are required (the codebase uses them inconsistently — prefer including them).

### Tailwind / CSS

- **Custom design tokens** are defined in `tailwind.config.js` — use them instead of raw colors:
  - Primary: `primary` (#82cfff), `primary-container`, `primary-fixed`, etc.
  - Error: `error` (#ffb4ab), `error-container`
  - Tertiary: `tertiary` (#f1c100), `tertiary-container`
  - Surface hierarchy: `surface`, `surface-container`, `surface-container-high`, `surface-dim`, etc.
  - Text: `on-surface`, `on-surface-variant`, `outline`, `outline-variant`
- **Typography classes** (custom): `font-headline-lg`, `font-label-caps`, `font-data-mono`, `font-body-sm`.
- **Spacing tokens**: `p-panel-padding` (12px), `gap-gutter` (16px), `p-unit` (4px).
- CSS variables for layout: `--sidebar-width: 80px`, `--header-height: 48px`.
- Global utility classes in `styles/global.css`: `hex-bg`, `radar-sweep`, `scrollbar-hide`.
- Use Tailwind backdrop-blur, transitions, and animations for the tactical UI aesthetic.

### Naming Conventions

- **HTML files**: PascalCase or kebab-case (e.g., `Asset-ready.html`, `map-view.html`).
- **JS files**: kebab-case (e.g., `shared-components.js`, `ai-system.js`).
- **JS globals**: PascalCase object names (e.g., `SharedComponents`, `AISystem`).
- **JS methods**: camelCase (e.g., `initSidebar`, `handleNav`, `loadContent`).
- **CSS classes**: Tailwind utility classes; custom classes use kebab-case (e.g., `hex-bg`, `radar-sweep`).
- **CSS variables**: kebab-case with `--` prefix (e.g., `--sidebar-width`, `--ai-accent`).
- **HTML IDs**: kebab-case (e.g., `header-placeholder`, `ai-threat-bar`, `main-wrapper`).
- **Menu/nav item IDs**: lowercase single words (e.g., `map`, `assets`, `fusion`, `comms`).

### SPA Navigation

The app uses a custom SPA-like navigation system in `SharedComponents`:
- Navigation uses `SharedComponents.handleNav(event, url)` → `history.pushState` + `fetch`.
- Only pages in the `allowedPaths` whitelist in `SharedComponents.loadContent` can be navigated to.
- New pages must be added to both the `allowedPaths` array and the `menuItems` in `sidebar()`.
- Content swapping replaces only `<main>` — header/sidebar persist.
- Inline `<script>` tags inside `<main>` are re-executed after navigation.

### AI System Integration

- `AISystem` follows a 5-phase pipeline: SCAN → DETECT → SUGGEST → PROTECT → REPORT.
- PROTECT phase implements Human-in-the-Loop (HITL) approval via `showHITLCard()`.
- AI state updates propagate via `CustomEvent('ai-update')` dispatched on `window`.
- Phase colors are defined in `SharedComponents.initAIUpdates()`.
- Threat score thresholds: >70 = CRITICAL/red, >40 = WARNING/amber, ≤40 = normal/sky.

### Error Handling

- Wrap async operations in `try/catch` and log errors with `console.error()`.
- Validate navigation URLs against the allowlist before fetching.
- Use safe DOM methods (`document.adoptNode`, `replaceChildren`) instead of `innerHTML` for injected content.
- Guard against missing DOM elements with `if (element)` checks.
- Use idempotency guards to prevent duplicate injection (e.g., `if (document.getElementById('sc-head-injected')) return;`).

### Security Considerations

- URL allowlisting in `loadContent()` prevents open-redirect / XSS via navigation.
- DOM adoption (`document.adoptNode`) is preferred over `innerHTML` for external HTML.
- Font/resource injection is idempotent and checks for existing elements.

## Adding a New Page

1. Create `new-page.html` following the existing template structure (see `map-view.html`).
2. Include Tailwind CDN + `tailwind.config.js` in `<head>`.
3. Add `header-placeholder`, `sidebar-placeholder`, and `main-wrapper` divs.
4. Load `shared-components.js` at end of `<body>`.
5. Add the filename to `allowedPaths` in `SharedComponents.loadContent()`.
6. Add a menu entry in `SharedComponents.sidebar()` → `menuItems` array.
