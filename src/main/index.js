'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
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
const cities = require('../../data/cities.json');

const ROOT = path.join(__dirname, '..', '..');
const ASSETS = path.join(ROOT, 'assets');
const RENDERER = path.join(__dirname, '..', 'renderer');
const SMOKE = process.env.SALAH_SMOKE === '1';

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
  win.loadFile(path.join(RENDERER, file), query ? { query } : undefined);
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  return win;
}

const openSettings = () => (settingsWin = openWindow(settingsWin, 'settings.html', { width: 560, height: 760, title: strings(store.get().language).app }));
const openAdhkar = (category) => (adhkarWin = openWindow(adhkarWin, 'adhkar.html', { width: 520, height: 700, title: strings(store.get().language).categories[category], query: { category } }));

function ensurePlayer() {
  if (playerWin && !playerWin.isDestroyed()) return playerWin;
  playerWin = new BrowserWindow({ show: false, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, backgroundThrottling: false } });
  playerWin.loadFile(path.join(RENDERER, 'player.html'));
  return playerWin;
}

// ---------- notifications ----------
function notify({ title, body, onClick }) {
  if (!Notification.isSupported()) return;
  const { notifications } = store.get();
  const custom = notifications.sound === 'custom' && notifications.customSoundPath && fs.existsSync(notifications.customSoundPath);
  const n = new Notification({ title, body, silent: notifications.sound !== 'default', icon: path.join(ASSETS, 'icon.png') });
  if (onClick) n.on('click', onClick);
  n.show();
  if (custom) {
    const win = ensurePlayer();
    const send = () => win.webContents.send('sound:play', pathToFileURL(notifications.customSoundPath).href);
    win.webContents.isLoading() ? win.webContents.once('did-finish-load', send) : send();
  }
}

function onEvent(e) {
  const settings = store.get();
  const s = strings(settings.language);
  const friday = e.prayer ? isFriday(e.at, settings.location.timeZone) : false;
  const prayer = e.prayer ? prayerName(settings.language, e.prayer, { friday }) : '';
  if (e.type === 'pre-adhan') notify({ title: s.preAdhanTitle(prayer, e.minutes), body: s.preAdhanBody });
  else if (e.type === 'adhan') notify({ title: s.adhanTitle(prayer), body: s.adhanBody });
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

ipcMain.handle('adhkar:get', (_e, category) => (CATEGORIES.includes(category) ? adhkarData[category] : []));

// ---------- lifecycle ----------
app.on('window-all-closed', () => { /* tray app: stay alive */ });
app.on('second-instance', () => openSettings());

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  store = new Store(app.getPath('userData'));
  adhkarData = loadAdhkar();
  const firstRun = !store.exists;
  if (firstRun) store.set(store.get());
  setAutostart(store.get().autostart);

  createTray();
  reminder = new Reminder({ getSettings: () => store.get(), onEvent });
  reminder.start();
  powerMonitor.on('resume', () => { reminder.tick(); refreshTray(); });

  const hidden = process.argv.includes('--hidden');
  if (SMOKE) {
    const sum = buildSummary(new Date(), store.get());
    console.log(`SMOKE next=${sum.next.name} in=${sum.next.countdown} title="${sum.trayTitle}"`);
    console.log('SMOKE rows=' + sum.rows.map((r) => `${r.key}:${r.time}`).join(' '));
    setTimeout(() => app.quit(), 1500);
    return;
  }
  if (process.env.SALAH_SHOT) return captureScreenshots(process.env.SALAH_SHOT);
  if (firstRun || (!hidden && !app.isPackaged)) openSettings();
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
