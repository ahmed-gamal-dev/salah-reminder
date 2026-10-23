# Owner-linked Arabic Windows Store package — 2026-10-23

Build commit: `96ff759db2426748eb7490acc240c234ad0269b2`.

[Successful Windows package run](https://github.com/ahmed-gamal-dev/salah-reminder/actions/runs/39992023411).
[Successful cross-platform CI](https://github.com/ahmed-gamal-dev/salah-reminder/actions/runs/39992023430).

## Verified in Windows CI

- 80 tests pass; existing prayer/scheduler and renderer regression coverage retained.
- Built x64 `Salah-Reminder-Store-1.1.4-x64.appx` with Electron 45 and current Windows packaging tools.
- Microsoft MakeAppx packed and unpacked the manifest without disabling validation.
- Inspected the produced package, not only the input config:
  - Arabic display name: **مواقيت الصلاة والأذكار**.
  - Identity: `AhmedGamalEissa.53203B7362789`.
  - Publisher: `CN=85DB4DCB-0BB5-4D72-8B61-6EFD02B02E0D`.
  - Publisher display name: `Ahmed Gamal Eissa`.
  - Application ID: `SalahReminder`.
  - Version: **1.1.4.0**; architecture: **x64**.
  - Arabic and English language declarations; actual artwork files with correct dimensions.
  - `runFullTrust` capability; main executable exists at the declared path.
  - Startup task exists, points to the real executable and passes `--hidden` through `uap10:Parameters`.
- Launched the unpacked Windows executable on the runner; it calculated today's six prayer times, emitted `SMOKE next=...`, and exited successfully.
- Built-in legacy packaging SDK failed to recognize the modern startup-argument schema; fixed by pinning `toolsets.winCodeSign=1.1.0` with the current Windows SDK, then repeating the complete build and checks.
- Store version adds one to source major: source `0.1.4` → Store `1.1.4.0`. This meets Microsoft's nonzero-major/zero-fourth-component rules without changing other release versions.

AppX SHA-256:

`17331859cdbd8edf13dab2d3840bd672df81847ac38792ea858b82af1b427615`

GitHub workflow artifact SHA-256:

`927030c3c14b13333095fb3dd2060e66ba02aee5c9e80fe0dc513a84e4931a09`

## Scope

The package is **unsigned for Microsoft Store submission**. Microsoft signs accepted Store packages; a paid external certificate is not required for this route. It is not a signed sideload installer. Store association means matching the reserved owner identity in the manifest; the package has not yet been uploaded to Partner Center or certified/published.

The smoke run exercised the unpacked executable, not a Store-installed package. Windows App Certification Kit, actual installed notifications/audio/startup, hardware-specific UI and Store certification remain subsequent checks. The user's installed macOS release was not replaced by this work.

Next: upload the `.appx` on the product's **Start submission → Packages** page and inspect Partner Center's validation result before completing the listing and review submission. See [upload instructions](../distribution/README.md#الرفع-خطوة-بخطوة).
