# Integrated notch island — v0.1.3

Verified using the packaged app installed in `/Applications` on a notched Mac.

- AppKit returned a camera housing width of **185 pt** and top inset of **33.5 pt**.
  The UI reserves a 197-pt center gap (housing plus 6-pt margins) and places controls on the two sides.
- Confirmed actual window `screenY=0`, not just the requested bounds. Electron originally clamped it to 34 pt;
  `enableLargerThanScreen: true` on the frameless window opts out of AppKit's constraint.
  See [Electron's implementation](https://github.com/electron/electron/blob/v45.0.0/shell/browser/ui/cocoa/electron_ns_window.mm#L259).
- Black surface is flush with the top edge; no detached border or green background. Its native animation canvas remains 620×428 pt.
- Native click opened today's times. Measured expansion: **413×38 → 488×334 → 500×380 pt**;
  collapse: **500×380 → 425×84 → 413×38 pt**. Window origin and dimensions stayed unchanged throughout.
- Simulated Reduce Motion in Chromium: computed transition duration became **0s**; restored the normal preference afterward.
- Native mouse event handling is limited to the visible rounded surface, excluding the camera and transparent canvas.
  Hit-test unit checks cover both wings, the camera gap, rounded corners and collapsed/expanded areas.
  Runtime checks observed interactive state returning to false after collapse. Captured transparent corner pixel: RGBA `(0,0,0,0)`.
- Scheduled-clock test triggered the adhan: expanded at y=0, visible Stop sound, audio playback active.
  Native click on Stop sound stopped playback and returned to the compact view.
- Restarted without diagnostic flags/test clock, leaving the persistent island enabled and user settings unchanged.
- 72 automated tests passed; local package signature verified. Multi-display/full-screen transitions and VoiceOver usability were not manually evaluated.

## Build

The Swift helper reads only local screen geometry and requires no screen-recording/accessibility permission.
It is compiled from source for the target architecture by the macOS `beforePack` hook; packaged users do not need Swift/Xcode.
On non-notched screens there is no camera gap. If native metrics fail, a conservative menu-bar-derived fallback is used.

![Compact integrated island](../screenshots/island-compact-ar.png)

![Expanded adhan](../screenshots/island-adhan-ar.png)
