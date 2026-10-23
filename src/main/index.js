'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { execFile } = require('child_process');
const { app, BrowserWindow, Tray, Menu, Notification, nativeImage, ipcMain, dialog, powerMonitor } = require('electron');

const { Store } = require('./store');
const { setAutostart } = require('./autostart');
const { detectLocation } = require('./geo');
const { Reminder } = require('../core/scheduler');
const { buildSummary } = require('../core/summary');
const { sanitize } = require('../core/settings');
const { loadAdhkar, CATEGORIES } = require('../core/adhkar');
const { strings, prayerName, isFriday } = require('../core/i18n');
const { METHODS } = require('../core/prayer');
const { lockScreen } = require('../core/lock');
const cities = require('../../data/cities.json');

const ROOT = path.join(__dirname, '..', '..');
const ASSETS = path.join(ROOT, 'assets');
const RENDERER = path.join(__dirname, '..', 'renderer');
const SMOKE = process.env.SALAH_SMOKE === '1';
// Test hook: SALAH_E2E=1 fast-forwards the clock to 4 s before the next prayer and logs what fires.
const E2E = process.env.SALAH_E2E === '1';
let clockOffset = 0;

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
app.setAppUserModelId('io.github.salah-reminder');

let store, tray, reminder, settingsWin, adhkarWin, playerWin;
let adhkarData;

// ---------- windows ----------
function openWindow(existing, file, { width, height, title, query }) {
  if (existing && !existing.isDestroyed()) {
    existing.show();
    existing.focus();
    return existing;
  }
  const win = new BrowserWindow({
    width, height, title, show: false, autoHideMenuBar: true,
    icon: path.join(ASSETS, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.removeMenu();
  win.on('closed', syncDock);
  win.loadFile(path.join(RENDERER, file), query ? { query } : undefined);
  win.once('ready-to-show', () => { win.show(); syncDock(); });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  return win;
}

const openSettings = () => (settingsWin = openWindow(settingsWin, 'settings.html', { width: 560, height: 760, title: strings(store.get().language).app }));
const openAdhkar = (category) => (adhkarWin = openWindow(adhkarWin, 'adhkar.html', { width: 520, height: 700, title: strings(store.get().language).categories[category], query: { category } }));

// Menu-bar apps have no Dock icon; show it only while a window is open so the app is reachable and quittable.
function syncDock() {
  if (process.platform !== 'darwin' || !app.dock) return;
  const open = [settingsWin, adhkarWin].some((w) => w && !w.isDestroyed() && w.isVisible());
  if (open) app.dock.show(); else app.dock.hide();
}

function ensurePlayer() {
  if (playerWin && !playerWin.isDestroyed()) return playerWin;
  playerWin = new BrowserWindow({ show: false, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' } });
  playerWin.loadFile(path.join(RENDERER, 'player.html'));
  return playerWin;
}

// ---------- sound ----------
let playing = false;

function soundFile(settings = store.get()) {
  const { sound, customSoundPath } = settings.notifications;
  if (sound === 'adhan') return path.join(ASSETS, 'sounds', 'adhan.ogg');
  if (sound === 'chime') return path.join(ASSETS, 'sounds', 'chime.wav');
  if (sound === 'custom' && customSoundPath && fs.existsSync(customSoundPath)) return customSoundPath;
  return null;
}

function playSound() {
  const settings = store.get();
  const file = soundFile(settings);
  if (!file) return false;
  const win = ensurePlayer();
  const send = () => { playing = true; win.webContents.send('sound:play', { url: pathToFileURL(file).href, volume: settings.notifications.volume }); refreshTray(); };
  win.webContents.isLoading() ? win.webContents.once('did-finish-load', send) : send();
  return true;
}

function stopSound() {
  if (playerWin && !playerWin.isDestroyed()) playerWin.webContents.send('sound:stop');
  playing = false;
  refreshTray();
}

// ---------- notifications ----------
function notify({ title, body, onClick, sound = false }) {
  if (Notification.isSupported()) {
    // Sound is played by us (volume + custom files), never by the OS notification.
    const n = new Notification({ title, body, silent: true, icon: path.join(ASSETS, 'icon.png') });
    n.on('click', () => { if (sound) stopSound(); if (onClick) onClick(); });
    n.show();
  }
  if (sound) playSound();
}

// ---------- prayer-time action (ask / lock) ----------
const run = (cmd, args) => new Promise((resolve, reject) => execFile(cmd, args, (err) => (err ? reject(err) : resolve())));

async function lockNow() {
  const r = await lockScreen({ run, exists: fs.existsSync });
  if (!r.ok) notify({ title: strings(store.get().language).lockFailed, body: r.errors.join('\n').slice(0, 200) });
  return r;
}

async function handlePrayerAction(e, prayerLabel) {
  const settings = store.get();
  const s = strings(settings.language);
  const snooze = settings.prayerAction.snoozeMinutes;
  const win = BrowserWindow.getFocusedWindow() || undefined;
  if (e.mode === 'lock') {
    const ac = new AbortController();
    const SECONDS = 15;
    const timer = setTimeout(() => { ac.abort(); lockNow(); }, SECONDS * 1000);
    try {
      const { response } = await dialog.showMessageBox({ type: 'info', title: s.app, message: s.lockCountdownTitle(prayerLabel), detail: s.lockCountdownBody(SECONDS), buttons: [s.lockNow, s.cancel], defaultId: 1, cancelId: 1, signal: ac.signal });
      clearTimeout(timer);
      if (response === 0) lockNow();
    } catch { /* aborted by the countdown: lockNow already ran */ }
    return;
  }
  const { response } = await dialog.showMessageBox(win, { type: 'question', title: s.app, message: s.lockAskTitle(prayerLabel), detail: s.lockAskBody, buttons: [s.lockNow, s.remindIn(snooze), s.dismiss], defaultId: 0, cancelId: 2 });
  if (response === 0) lockNow();
  else if (response === 1) setTimeout(() => handlePrayerAction(e, prayerLabel), snooze * 60 * 1000);
}

function onEvent(e) {
  const settings = store.get();
  const s = strings(settings.language);
  const friday = e.prayer ? isFriday(e.at, settings.location.timeZone) : false;
  const prayer = e.prayer ? prayerName(settings.language, e.prayer, { friday }) : '';
  if (e.type === 'pre-adhan') notify({ title: s.preAdhanTitle(prayer, e.minutes), body: s.preAdhanBody });
  else if (e.type === 'adhan') notify({ title: s.adhanTitle(prayer), body: s.adhanBody, sound: true });
  else if (e.type === 'prayer-action') handlePrayerAction(e, prayer);
  else if (e.type === 'adhkar') notify({ title: s.adhkarTitle[e.category], body: s.adhkarBody, onClick: () => openAdhkar(e.category) });
}

// ---------- tray ----------
function createTray() {
  const mac = process.platform === 'darwin';
  const img = nativeImage.createFromPath(path.join(ASSETS, mac ? 'trayTemplate.png' : 'tray.png'));
  if (mac) img.setTemplateImage(true);
  tray = new Tray(img);
  refreshTray();
  setInterval(refreshTray, 15 * 1000);
}

function refreshTray() {
  if (!tray) return;
  const settings = store.get();
  const s = strings(settings.language);
  const sum = buildSummary(new Date(), settings);
  if (process.platform === 'darwin') tray.setTitle(sum.trayTitle ? ` ${sum.trayTitle}` : '');
  tray.setToolTip(sum.tooltip);

  const rows = sum.rows.map((r) => ({ label: `${r.isNext ? '▶ ' : '   '}${r.label}\t${r.time}`, enabled: true, click: openSettings }));
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `${s.next}: ${sum.next.label} ${sum.next.time} (${s.in} ${sum.next.countdown})`, enabled: false },
    { label: settings.location.name, enabled: false },
    { type: 'separator' },
    { label: s.menu.today, enabled: false },
    ...rows,
    { type: 'separator' },
    ...(playing ? [{ label: s.stopAdhan, click: stopSound }, { type: 'separator' }] : []),
    { label: s.menu.adhkar, submenu: CATEGORIES.map((c) => ({ label: s.categories[c], click: () => openAdhkar(c) })) },
    { label: s.menu.settings, click: openSettings },
    { type: 'separator' },
    { label: s.menu.quit, click: () => app.quit() },
  ]));
}

// ---------- ipc ----------
function broadcast() {
  for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send('state:changed');
}

ipcMain.handle('state:get', () => {
  const settings = store.get();
  return {
    settings,
    cities,
    methods: Object.keys(METHODS),
    summary: buildSummary(new Date(), settings),
    strings: Object.fromEntries(Object.entries(strings(settings.language)).filter(([, v]) => typeof v !== 'function')),
    platform: process.platform,
    version: app.getVersion(),
  };
});

ipcMain.handle('settings:save', (_e, incoming) => {
  const prevLang = store.get().language;
  const saved = store.set(incoming);
  setAutostart(saved.autostart);
  refreshTray();
  if (prevLang !== saved.language) {
    for (const w of [settingsWin, adhkarWin]) if (w && !w.isDestroyed()) w.setTitle(strings(saved.language).app);
  }
  broadcast();
  return saved;
});

ipcMain.handle('geo:detect', async () => {
  try {
    return { ok: true, location: await detectLocation() };
  } catch (err) {
    return { ok: false, error: String(err && err.message) };
  }
});

ipcMain.handle('sound:pick', async () => {
  const r = await dialog.showOpenDialog(settingsWin, { properties: ['openFile'], filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }] });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('notify:test', () => {
  const s = strings(store.get().language);
  notify({ title: s.app, body: s.adhanBody });
});
ipcMain.handle('sound:test', () => { playSound(); });
ipcMain.handle('sound:stop', () => { stopSound(); });
ipcMain.on('sound:ended', () => { playing = false; refreshTray(); });
ipcMain.on('sound:started', (_e, info) => { if (E2E) console.log(`E2E sound started duration=${info.duration.toFixed(1)}s volume=${info.volume}`); });

ipcMain.handle('adhkar:get', (_e, category) => (CATEGORIES.includes(category) ? adhkarData[category] : []));

// ---------- lifecycle ----------
app.on('window-all-closed', () => { /* tray app: stay alive */ });
app.on('second-instance', () => openSettings());
app.on('activate', () => { if (app.isReady() && store) openSettings(); }); // clicking the Dock/Finder/Spotlight icon

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  store = new Store(app.getPath('userData'));
  adhkarData = loadAdhkar();
  const firstRun = !store.exists;
  if (firstRun) store.set(store.get());
  setAutostart(store.get().autostart);

  createTray();
  if (E2E) {
    const next = buildSummary(new Date(), store.get()).next;
    clockOffset = next.at.getTime() - 4000 - Date.now();
    console.log(`E2E fast-forward to ${next.name}`);
  }
  reminder = new Reminder({ getSettings: () => store.get(), onEvent: (e) => { if (E2E) console.log(`E2E event ${e.id}`); onEvent(e); }, now: () => new Date(Date.now() + clockOffset) });
  reminder.start();
  powerMonitor.on('resume', () => { reminder.tick(); refreshTray(); });

  const hidden = process.argv.includes('--hidden');
  if (E2E) setTimeout(() => app.quit(), 20000);
  if (SMOKE) {
    const sum = buildSummary(new Date(), store.get());
    console.log(`SMOKE next=${sum.next.name} in=${sum.next.countdown} title="${sum.trayTitle}"`);
    console.log('SMOKE rows=' + sum.rows.map((r) => `${r.key}:${r.time}`).join(' '));
    setTimeout(() => app.quit(), 1500);
    return;
  }
  if (process.env.SALAH_SHOT) return captureScreenshots(process.env.SALAH_SHOT);
  if (!hidden && !E2E) openSettings(); // manual launch always shows a window; --hidden is used by launch-at-login
});

// Dev helper for README screenshots: SALAH_SHOT=<dir> npm start
async function captureScreenshots(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const shoot = async (win, name) => {
    await new Promise((r) => win.webContents.once('did-finish-load', r));
    await new Promise((r) => setTimeout(r, 800));
    fs.writeFileSync(path.join(dir, name), (await win.webContents.capturePage()).toPNG());
  };
  const s = openSettings();
  await shoot(s, `settings-${store.get().language}.png`);
  const a = openAdhkar('morning');
  await shoot(a, `adhkar-${store.get().language}.png`);
  app.quit();
}
