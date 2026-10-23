<div align="center">

# 🕌 Salah Reminder · مواقيت الصلاة والأذكار

Offline prayer times and adhkar reminders that live in your menu bar / system tray.<br>
مواقيت صلاة وتذكير بالأذكار يعمل بدون إنترنت من شريط القوائم / صينية النظام.

[English](#english) · [العربية](#العربية)

![license](https://img.shields.io/badge/license-MIT-green) ![platforms](https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20Linux-blue)

</div>

<!-- Replace with real screenshots from the packaged app on each OS (see CONTRIBUTING.md). -->
| Settings (Arabic) | Adhkar | Tray / menu bar |
| --- | --- | --- |
| ![settings](docs/screenshots/settings-ar.png) | ![adhkar](docs/screenshots/adhkar-ar.png) | _screenshot placeholder: `docs/screenshots/tray.png`_ |

---

## English

### Features
- **Offline calculation** with [adhan-js](https://github.com/batoulapps/adhan-js): Egyptian, Muslim World League, Umm al-Qura, Karachi, ISNA, Dubai, Kuwait, Qatar, Singapore, Turkey (Diyanet), Tehran, Moonsighting Committee; Shafi/Hanafi Asr; manual per-prayer minute adjustments; high-latitude handling.
- **Location:** pick from 40+ built-in cities, enter coordinates, or press *Detect* (the only network call, user-initiated, IP-based).
- **Notifications** before the adhan (configurable minutes) and at prayer time. At prayer time the app plays the **adhan** (bundled, CC0), a soft chime, your own audio file, or nothing, with a volume slider, a *Test sound* button and a *Stop* item in the tray menu. Sound plays even when no window is open.
- **Optional: lock the computer at prayer time** — off by default. Choose per prayer: *ask me* (Lock / Remind me in N min / Later) or *lock automatically* after a 15-second cancellable countdown. Uses the OS lock screen (`pmset displaysleepnow` on macOS — needs "Require password after sleep" enabled in System Settings, `LockWorkStation` on Windows, `loginctl lock-session` with fallbacks on Linux).
- **Adhkar reminders:** morning (after Fajr), evening (after Asr) and after each prayer, with configurable delays. Click the notification to open a counter-based reader.
- **Tray / menu bar:** next prayer + countdown (shown next to the icon on macOS; tooltip + menu on Windows/Linux), full day's times in the menu. Friday shows *Jumu'ah*.
- **macOS notch bar:** an optional black Dynamic-Island-style surface merged with the top edge and camera housing. At rest it matches the physical notch width exactly. Hover to reveal today’s times, the next prayer and countdown; move away to fold it back. Native macOS safe-area metrics keep expanded controls clear of the camera; expansion and collapse animate smoothly, respecting Reduce Motion. Collapse and Escape remain available outside adhan playback. At the adhan it expands with a Stop sound button and stays expanded until playback ends or you stop it. Other reminders fold back after 15 seconds. Works at the top edge on screens without a notch too. Transparent space passes clicks through to the app underneath. Enable macOS notifications under System Settings → Notifications → Salah Reminder.
- **Launch at login**, Arabic (RTL) and English UI.

### Install
Download the installer for your OS from the [Releases](../../releases) page (`.dmg` macOS, `.exe` Windows, `.AppImage`/`.deb` Linux).

> The builds are **not notarized/code-signed yet** (macOS builds carry a valid ad-hoc signature). macOS: the first time, right-click the app → *Open*, or *System Settings → Privacy & Security → Open Anyway*, or run `xattr -cr "/Applications/Salah Reminder.app"`. Windows: *More info → Run anyway* in SmartScreen.
>
> **It lives in the menu bar / tray**, so nothing appears in the Dock at first. Launching the app opens the Settings window; the icon (a crescent) with the countdown is in the menu bar (on notched MacBooks it can hide behind the notch if the bar is crowded — quit a few menu-bar apps or use Bartender/Ice).

### Run from source
```bash
npm install
npm start          # tray app (opens Settings on first run)
npm test           # unit tests
npm run dist       # package for the current OS into dist/
```

Local macOS verification: [release artifact, audio, notifications and banner](docs/verification/macos-2026-10-23.md).

Building from source on macOS requires the Xcode Command Line Tools (Swift). The packaged app already includes the small native geometry helper.

### Releasing
Push a tag (`git tag v0.1.0 && git push --tags`). GitHub Actions builds macOS, Windows and Linux packages and attaches them to a GitHub Release.

### Browser extension (Chrome & Firefox)
A lightweight companion lives in [`extension/`](extension/) (Manifest V3, one codebase for both browsers). It shares the prayer-time engine (`src/core`) and the adhkar/city data (`data/`) with the desktop app.

- **v1:** popup with today's times, next prayer and countdown (also on the toolbar badge); notifications before and at the adhan; morning/evening/after-prayer adhkar reminders with a counter-based reader; options page (city/coordinates, method, madhab, language).
- **Not in v1:** adhan audio (Chrome MV3 needs an offscreen document — planned for v2) and locking the computer (browsers cannot do that; use the desktop app).
- Build: `npm run build:extension` (folders in `dist-extension/chrome` and `dist-extension/firefox`) or `npm run zip:extension` (zips; CI attaches them to every release). Load unpacked: Chrome → `chrome://extensions` → *Developer mode* → *Load unpacked*; Firefox → `about:debugging` → *Load Temporary Add-on* → pick `manifest.json`.
- Not published to the Chrome Web Store / AMO yet.

### Adhkar sources
The text in [`data/adhkar.json`](data/adhkar.json) consists of Quran verses and hadith wording from the six canonical collections (Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Jami' at-Tirmidhi, Sunan an-Nasa'i, Ibn Majah), as compiled in *Hisn al-Muslim* (Sa'id ibn Wahf al-Qahtani). Quran text and hadith wording are not under copyright; this project's compilation is MIT-licensed. Each item carries its own reference. English meanings are our own paraphrase. **Please report any wording or reference error** by opening an issue — the list is intentionally small and conservative; contributions welcome (see [CONTRIBUTING](CONTRIBUTING.md)).

### Disclaimer
Calculated times can differ by a few minutes from your local mosque or official authority. Use the manual adjustment setting to match them.

### Credits
Adhan recording: ["Beautiful adhan.ogg"](https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg) by Adam-synagda, CC0 (Wikimedia Commons).<br>
[adhan-js](https://github.com/batoulapps/adhan-js) (MIT) · [Electron](https://www.electronjs.org/) (MIT).

---

## العربية

### المميزات
- **حساب المواقيت بدون إنترنت** بمكتبة [adhan-js](https://github.com/batoulapps/adhan-js): الهيئة المصرية، رابطة العالم الإسلامي، أم القرى، كراتشي، أمريكا الشمالية، دبي، الكويت، قطر، سنغافورة، ديانت تركيا، طهران، لجنة رؤية الهلال، مع مذهب العصر (جمهور/حنفي) وتعديل يدوي بالدقائق لكل صلاة.
- **الموقع:** اختر من أكثر من ٤٠ مدينة، أو أدخل الإحداثيات، أو اضغط «تحديد تلقائي» (الاتصال الوحيد بالإنترنت، وبطلبك فقط).
- **تنبيهات** قبل الأذان (بعدد دقائق تضبطه) وعند دخول الوقت. عند دخول الوقت يشغّل البرنامج **الأذان** (مرفق، ترخيص CC0) أو تنبيهًا هادئًا أو ملفًا صوتيًا من اختيارك أو لا شيء، مع التحكم في مستوى الصوت وزر «تجربة الصوت» وخيار «إيقاف الصوت» في القائمة. الصوت يعمل حتى لو لا توجد نافذة مفتوحة.
- **اختياري: قفل الجهاز وقت الصلاة** — مغلق افتراضيًا. اختر لكل صلاة: «اسألني» (قفل / ذكّرني بعد دقائق / لاحقًا) أو «اقفل تلقائيًا» بعد عدّ تنازلي ١٥ ثانية قابل للإلغاء. على macOS فعّل «طلب كلمة المرور بعد السكون» ليكون القفل فعليًا.
- **تذكير بالأذكار:** الصباح (بعد الفجر)، المساء (بعد العصر)، وبعد كل صلاة، بتأخير قابل للضبط. اضغط على التنبيه لفتح قارئ بعدّاد للتكرار.
- **أيقونة الشريط/الصينية:** الصلاة القادمة والعد التنازلي (بجانب الأيقونة في macOS، وفي التلميح والقائمة على Windows/Linux)، ومواقيت اليوم كاملة في القائمة. يوم الجمعة يظهر «الجمعة».
- **شريط النوتش على الماك:** واجهة سوداء اختيارية مندمجة مع النوتش والحافة العلوية، حجمها العادي قد النوتش بالضبط. الوقوف بالماوس يفتح مواقيت اليوم والصلاة القادمة والعد التنازلي، وإبعاد الماوس يطويها. التوسّع والطي بحركة ناعمة تحترم إعداد «تقليل الحركة». يمكن استخدام «طي» وEscape خارج وقت تشغيل الأذان. وقت الأذان يتوسع مع زر «إيقاف الصوت» ويظل موسعًا حتى انتهاء الصوت أو إيقافه. باقي التنبيهات ترجع للشريط بعد ١٥ ثانية. يعمل أيضًا عند الحافة العلوية في الشاشات بدون نوتش، والمساحة الشفافة تمرّر الضغط للتطبيق الموجود تحتها. فعّل إشعارات التطبيق من إعدادات النظام ← الإشعارات ← Salah Reminder.
- **تشغيل تلقائي** مع بدء النظام، وواجهة عربية (RTL) وإنجليزية.

### التثبيت
نزّل ملف التثبيت لنظامك من صفحة [Releases](../../releases) (`.dmg` للماك، `.exe` للويندوز، `.AppImage` أو `.deb` للينكس).

> النسخ **غير موثّقة/موقّعة رقميًا حاليًا**. على macOS: أول مرة كليك يمين على التطبيق ← «فتح»، أو من «إعدادات النظام ← الخصوصية والأمان ← فتح على أي حال»، أو نفّذ `xattr -cr "/Applications/Salah Reminder.app"`. على Windows: «مزيد من المعلومات ← تشغيل على أي حال».
>
> **البرنامج يعيش في شريط القوائم/الصينية** فلن تظهر أيقونة في الـ Dock في البداية. تشغيل التطبيق يفتح نافذة الإعدادات، وأيقونة الهلال مع العد التنازلي في شريط القوائم (في أجهزة MacBook ذات النوتش قد تختفي خلفها إذا كان الشريط مزدحمًا).

### التشغيل من الكود
```bash
npm install
npm start      # يفتح الإعدادات أول مرة
npm test       # الاختبارات
npm run dist   # بناء حزمة للنظام الحالي
```

### إضافة المتصفح (Chrome وFirefox)
إضافة خفيفة في مجلد [`extension/`](extension/) (Manifest V3، كود واحد للمتصفحين) تشارك التطبيق محرك حساب المواقيت (`src/core`) وبيانات الأذكار والمدن (`data/`).

- **النسخة الأولى:** نافذة منبثقة بمواقيت اليوم والصلاة القادمة والعد التنازلي (وعلى شارة الأيقونة)، تنبيهات قبل الأذان وعنده، تذكير بأذكار الصباح والمساء وبعد الصلاة مع قارئ بعدّاد، وصفحة إعدادات (المدينة/الإحداثيات، الطريقة، المذهب، اللغة).
- **ليس في النسخة الأولى:** صوت الأذان (يحتاج offscreen document في Chrome — مخطط للإصدار الثاني)، وقفل الجهاز (المتصفح لا يستطيع؛ استخدم تطبيق سطح المكتب).
- البناء: `npm run build:extension` أو `npm run zip:extension`. للتجربة: Chrome ← `chrome://extensions` ← وضع المطوّر ← «تحميل غير معبأ»؛ Firefox ← `about:debugging` ← «Load Temporary Add-on».
- غير منشورة على متجر Chrome ولا AMO حاليًا.

### مصدر صوت الأذان
تسجيل «Beautiful adhan.ogg» من Wikimedia Commons بواسطة Adam-synagda، ترخيص CC0 (ملكية عامة). يمكنك استبداله بأي ملف تفضّله من الإعدادات.

### مصادر الأذكار
نصوص [`data/adhkar.json`](data/adhkar.json) هي آيات قرآنية وألفاظ أحاديث من الكتب الستة (صحيح البخاري، صحيح مسلم، سنن أبي داود، جامع الترمذي، سنن النسائي، سنن ابن ماجه) كما جُمعت في «حصن المسلم» للشيخ سعيد بن وهف القحطاني. نص القرآن وألفاظ الأحاديث غير خاضعة لحقوق النشر، وهذا التجميع مرخّص بـ MIT. كل ذكر معه مرجعه. المعاني الإنجليزية من صياغتنا. **القائمة مختصرة ومتحفظة عمدًا — من لاحظ خطأ في لفظ أو عزو فليفتح issue، والمساهمات مرحّب بها.**

### تنبيه
قد تختلف المواقيت المحسوبة بدقائق عن مسجدك أو الجهة الرسمية، استخدم التعديل اليدوي للمطابقة.

---

MIT © Ahmed Gamal

## Signing and stores / التوقيع والمتاجر

See [distribution preparation](docs/distribution/README.md), [privacy policy](PRIVACY.md) and [store listing drafts](docs/distribution/listing-copy.md). The signed-build workflow is manual and needs owner credentials; GitHub release availability does not imply store approval.
