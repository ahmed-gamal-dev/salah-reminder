# Distribution preparation / تجهيز التوقيع والمتاجر

Reviewed 2026-10-23. The published v0.1.4 assets are **unsigned/ad-hoc**, not notarized or store-approved. Do not replace those assets silently or move the tag. Publish signed builds under a new version after owner credentials and runtime validation.

## Owner accounts and costs

Publish under Ahmed's personal developer accounts. No certificate belonging to another person/team may be used. The owner completes identity verification, agreement acceptance and payments directly.

| Destination | Account fee | Next input / blocker |
| --- | --- | --- |
| Apple Developer | US$99/year, regional tax/pricing may differ | Owner Team ID; Developer ID Application for downloads; Apple Distribution + installer certificate/profile for MAS |
| Microsoft Store | Individual registration currently free | Partner Center identity/package reservation; choose AppX/MSIX store route or signed EXE |
| Chrome Web Store | US$5 once | Activated publisher account, verified contact details, listing artwork |
| Firefox AMO | No submission/signing fee | Mozilla developer account, source/rebuild archive, listing |
| Snap Store | Free publishing/hosting | Owner Snapcraft account + name reservation, confined package/runtime testing |
| Flathub | No developer registration fee | Application metadata, Flatpak manifest, Linux runtime validation and submission review |

Official references: [Apple membership](https://developer.apple.com/programs/), [Microsoft registration](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account), [Chrome fee](https://blog.chromium.org/2020/03/new-developer-dashboard-and.html), [AMO submission](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/), [Snap](https://snapcraft.io/about), [Flathub submission](https://docs.flathub.org/docs/for-app-authors/submission).

## Signed direct downloads (prepared, credentials still required)

The manual **Signed direct-download build** workflow runs tests, requires credentials, builds with `build/signed.cjs`, verifies the signature and uploads workflow artifacts. It does **not** publish or overwrite a GitHub Release, submit to any store, or run on a tag push. Select a reviewed workflow ref containing the preparation files. Its artifacts include the exact commit hash.

Repository Actions secrets, supplied by the owner through GitHub settings (never committed or pasted into chat):

- macOS: `MAC_CSC_LINK` (owner Developer ID Application `.p12` encoded as base64), `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.
- Windows, direct EXE route: `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` for the owner's Authenticode certificate. A hardware/cloud signing account needs an additional provider-specific setup; this workflow only implements exportable certificate files.

The macOS configuration enables hardened runtime and notarization and explicitly unpacks/signs the native screen-metrics executable. Verification requires a Developer ID authority, stapled ticket and Gatekeeper assessment. Do not treat an ad-hoc `codesign --verify` pass as proof of Developer ID trust. Signed build execution has not been verified without owner credentials.

Local equivalent after configuring the owner's signing/notarization environment:

```sh
npm run dist:mac -- --config build/signed.cjs --publish never
npm run dist:win -- --config build/signed.cjs --publish never
```

References: [Apple Developer ID](https://developer.apple.com/developer-id/), [electron-builder signing](https://www.electron.build/docs/features/code-signing/).

## Mac App Store is a separate build

A Developer ID DMG cannot be uploaded as a MAS submission. Electron's **MAS** runtime, App Sandbox entitlements, owner provisioning profile, App Store Connect app record and store distribution/installer certificates are required. Transporter uploads the signed submission package.

Audit/test these features before a MAS submission: external screen-lock commands, login-item registration, local custom sound file access/bookmarks, the Swift geometry helper as a signed sandboxed child, and the always-on-top notch panel across Spaces/full-screen. Remove or adapt unsupported behavior for MAS; the normal desktop build must retain it. No MAS-ready claim is made for v0.1.4.

Reference: [Electron MAS guide](https://www.electronjs.org/docs/latest/tutorial/mac-app-store-submission-guide).

## Microsoft Store

Prefer the packaged AppX/MSIX route: Microsoft re-signs accepted store packages, so a separate purchased CA certificate is not required for that route. The existing EXE route requires the owner to Authenticode-sign both installer and applicable executables; Microsoft does not re-sign EXE/MSI submissions. Package identity/publisher must match the reserved Partner Center identity exactly; configure after the owner supplies those values, not with an invented identity. Re-test autostart, tray, sound and notifications in the installed store package.

Reference: [Microsoft Store signing FAQ](https://learn.microsoft.com/en-us/windows/apps/publish/faq/get-started-with-the-microsoft-store).

## Browser stores

`npm ci && npm run zip:extension` generates separate Chrome/Firefox ZIPs. They have three permissions only: `alarms`, `notifications`, `storage`; no page access, analytics or IP lookup. Firefox declares no data collection. Use [PRIVACY.md](../../PRIVACY.md) for the policy and [listing-copy.md](listing-copy.md) for descriptions and reviewer notes. The extensions provide reminders/notifications, not the desktop notch or the full desktop audio/lock feature set.

For AMO, supply original source and reproducible build instructions with dependencies pinned by `package-lock.json`. Source archives must correspond to the uploaded version; omit credentials, local settings and node_modules. The GitHub ZIP is **not a Mozilla-signed XPI**; AMO signs after upload. For Chrome, upload the Chrome ZIP to the publisher dashboard. Both require store artwork/screenshots and a verified support contact before completing the listing. Do not mark store approval complete merely because archive generation passes.

## Linux destinations

The release currently provides amd64 `.deb` and `.AppImage` downloads, not a registered APT repository. Start with Flathub and/or Snap Store; a Flatpak/Snap build is still required. Prepare AppStream metadata, desktop integration, icons, verified app identity, offline dependency sources and sandbox-compatible permissions. Validate tray behavior, notifications, audio and autostart on an actual Linux desktop. External lock commands may not work inside confinement. Flathub initial submission is reviewed; a Snap name must be reserved by the owner before publication. A self-hosted signed APT/RPM repository is a separate maintenance commitment, not created by uploading DEB files to GitHub.

## العربية

التجهيز الحالي يضيف سياسة خصوصية، نصوص المتاجر ومسار بناء يدوي للتوقيع الحقيقي. النشر في المتاجر لم يتم بعد. نحتاج حسابات أحمد المفعّلة وتحديد فريقه، ثم إضافة الشهادات والأسرار في إعدادات GitHub. أحمد يتولى قبول الاتفاقيات والدفع والتحقق من الهوية بنفسه. نسخة متجر Apple تحتاج تعديلًا واختبارًا منفصلًا للـ sandbox، ونسخة Microsoft تحتاج هوية الحزمة من حسابه. ملفات إضافات المتصفح متاحة للبناء؛ Firefox يحتاج توقيع Mozilla قبل التثبيت العادي. لينكس يحتاج حزم Flatpak/Snap واختبارها قبل التقديم.
