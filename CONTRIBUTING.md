# Contributing · المساهمة

Thank you for helping! جزاكم الله خيرًا.

## Setup

```bash
git clone <your fork>
cd salah-reminder
npm install
npm test        # unit tests (prayer times, scheduler, settings, adhkar data)
npm start       # run the tray app
```

Requires Node 20+.

## Project layout

| Path | What |
| --- | --- |
| `src/core/` | Pure logic, no Electron: prayer times (`prayer.js`), reminder scheduling (`scheduler.js`), settings validation, i18n, tray summary. **Keep it pure and tested.** |
| `src/main/` | Electron main process: tray, notifications, autostart, IPC |
| `src/renderer/` | Settings and adhkar windows (plain HTML/JS, strict CSP, no framework) |
| `extension/` | Chrome/Firefox MV3 extension; bundled by `scripts/build-extension.js`, reuses `src/core` and `data/` |
| `data/adhkar.json` | Adhkar text + sources |
| `data/cities.json` | Built-in city presets |

## Guidelines

- Add a test for any change to `src/core/`. CI runs on Linux, macOS and Windows.
- UI text must exist in both Arabic and English (`src/core/i18n.js`, `src/renderer/settings.js`).
- **Adhkar changes:** every item needs the Arabic text, an English meaning, a repeat count and a precise source (collection + number). Only add adhkar with authentic (sahih/hasan) chains, and quote Quran text exactly. `npm test` validates the structure.
- Do not bundle copyrighted audio (e.g. recordings of a specific muezzin) unless its license allows redistribution.
- Keep the app offline by default; any network call must be user-initiated.

## Pull requests

Small, focused PRs with a clear description. Use the screenshot helper to show UI changes:

```bash
SALAH_SHOT=./docs/screenshots npm start
```

## Native notch metrics (macOS)

`build/notch-metrics.swift` reads AppKit safe-area geometry. `scripts/build-notch-helper.js` compiles it before packaging and before `npm start` (macOS only; requires Xcode Command Line Tools). The generated executable is ignored by Git and included in the packaged assets. Shared layout/hit-test geometry lives in `src/core/island-geometry.js`.
