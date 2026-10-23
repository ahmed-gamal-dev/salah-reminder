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

The package is **unsigned for Microsoft Store submission**. Microsoft signs accepted Store packages; a paid external certificate is not required for this route. It is not a signed sideload installer. Store association means matching the reserved owner identity in the manifest; the package was uploaded to Partner Center and validated. Submission 1 is now **In certification**, not yet approved or published.

The smoke run exercised the unpacked executable, not a Store-installed package. Windows App Certification Kit, actual installed notifications/audio/startup, hardware-specific UI and Store certification remain subsequent checks. The user's installed macOS release was not replaced by this work.

## Partner Center submission

- Uploaded the verified AppX; Partner Center reported **Validated / Complete**.
- Completed free worldwide availability, privacy/support properties, IARC age ratings (with the owner's explicit consent), Arabic and English listings, and reviewer instructions.
- Added two genuine Windows application screenshots per listing. Capture workflow [39994981261](https://github.com/ahmed-gamal-dev/salah-reminder/actions/runs/39994981261) passed; Chromium viewport capture was corrected after visual inspection found clipping in the initial images.
- Submitted submission `1152921505702216227` on 2026-10-23. The live overview confirmed **In certification**.
- Publishing is configured to begin automatically after certification succeeds. Microsoft states review usually takes a few hours, occasionally up to three business days. Approval and public availability remain pending.

Next: inspect certification results in Partner Center and address any reviewer findings before verifying the Store-installed build.
