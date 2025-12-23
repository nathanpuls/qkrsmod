# Copilot Instructions for qkrsmod-esm

## Project Overview
- This is a static web project with all source code in the `js/` directory and static assets/pages in the `x/` directory.
- No build step or framework is present; files are served directly (e.g., with `serve`).
- The project is modularized by feature: each file in `js/` handles a specific concern (e.g., `firebase.js`, `hashtag.js`, `qr.js`).
- The `ui/` subfolder in `js/` contains UI-related logic, separated by feature (e.g., `copy.js`, `search.js`).

## Key Patterns & Conventions
- All scripts are loaded via `<script type="module">` in HTML files, using ES module imports.
- Cross-feature logic is handled by importing modules from `js/`.
- No global build system; changes are reflected immediately on refresh.
- Use descriptive, feature-based filenames. Avoid generic names.
- UI logic is separated into `js/ui/` for maintainability.
- Static HTML pages are organized by route in `x/` (e.g., `x/recent/index.html`).

## Developer Workflows
- To serve locally: `serve .` (requires `npm i -g serve`).
- No automated tests or build scripts are present.
- For HTTPS local dev, self-signed certs can be generated (see terminal history: `openssl req ...`).

## Integration & External Dependencies
- Firebase integration is handled in `js/firebase.js`.
- No package.json or npm dependencies (except for local dev server).
- No backend; all logic is client-side.

## Examples
- To add a new feature, create a new module in `js/` and import it where needed.
- To add a new UI component, place logic in `js/ui/` and reference it from the relevant HTML page.

## References
- Main logic: `js/main.js`
- UI logic: `js/ui/`
- Static pages: `x/`
- Firebase: `js/firebase.js`

---

If you add new conventions or workflows, update this file to keep AI agents productive.
