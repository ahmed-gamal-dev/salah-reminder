'use strict';
const path = require('path');
const { execFile } = require('child_process');
const { BrowserWindow, screen } = require('electron');
const { countdownClock, OverlayState } = require('../core/overlay');
const { islandLayout } = require('../core/island-geometry');

class PrayerOverlay {
  constructor() {
    this.win = null; this.state = new OverlayState(); this.summary = null; this.settings = null; this.now = new Date();
    this.metrics = new Map(); this.metricsReady = false; this.loadingMetrics = false; this.eventsBound = false;
  }
  update(summary, settings, now, playing) {
    this.summary = summary; this.settings = settings; this.now = now;
    this.state.configure(settings.notifications.topBanner); this.state.playback(playing); this.state.tick(now.getTime());
    this.present();
  }
  show(payload) { this.state.notify(payload, this.now.getTime()); this.present(); }
  toggleToday() { this.state.toggleToday(); this.present(); }
  collapse() { this.state.collapse(); this.present(); }
  display() { return screen.getAllDisplays().find((d) => d.internal) || screen.getPrimaryDisplay(); }
  refreshMetrics() {
    if (this.loadingMetrics) return;
    this.loadingMetrics = true;
    const helper = path.join(__dirname, '..', '..', 'assets', 'macos', 'notch-metrics');
    execFile(helper, [], { timeout: 2000 }, (err, stdout) => {
      this.loadingMetrics = false;
      if (!err) {
        try {
          this.metrics = new Map(JSON.parse(stdout).filter((m) => Number.isFinite(m.id) && Number.isFinite(m.width) && m.width >= 0 && m.width < 600 && Number.isFinite(m.height) && m.height >= 0 && m.height < 100).map((m) => [m.id, m]));
        } catch { /* Use a safe menu-bar-derived layout if native metrics are unavailable. */ }
      }
      this.metricsReady = true; this.present();
    });
  }
  ensureWindow(layout) {
    if (this.win && !this.win.isDestroyed()) return;
    this.win = new BrowserWindow({
      ...layout.window, show: false, frame: false, transparent: true, backgroundColor: '#00000000',
      resizable: false, movable: false, minimizable: false, maximizable: false,
      alwaysOnTop: true, skipTaskbar: true, hasShadow: false,
      // Frameless windows need this to opt out of AppKit's menu-bar position clamp.
      enableLargerThanScreen: true, acceptFirstMouse: true,
      webPreferences: { preload: path.join(__dirname, 'overlay-preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
    this.win.setAlwaysOnTop(true, 'status');
    this.win.setIgnoreMouseEvents(true, { forward: true });
    this.win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    this.win.webContents.on('will-navigate', (e) => e.preventDefault());
    this.win.loadFile(path.join(__dirname, '..', 'renderer', 'overlay.html'));
    this.win.webContents.once('did-finish-load', () => this.present());
  }
  setInteractive(interactive) {
    if (this.win && !this.win.isDestroyed()) this.win.setIgnoreMouseEvents(!interactive, { forward: true });
  }
  present() {
    if (!this.summary) return;
    if (!this.state.visible) { if (this.win && !this.win.isDestroyed()) this.win.hide(); return; }
    if (!this.eventsBound) {
      this.eventsBound = true;
      for (const name of ['display-added', 'display-removed', 'display-metrics-changed']) screen.on(name, () => this.refreshMetrics());
    }
    if (!this.metricsReady) { this.refreshMetrics(); return; }
    const display = this.display();
    const layout = islandLayout(display, this.metrics.get(display.id), this.state.view);
    this.ensureWindow(layout);
    if (this.win.webContents.isLoading()) return;
    const current = this.win.getBounds();
    if (Object.keys(layout.window).some((k) => layout.window[k] !== current[k])) this.win.setBounds(layout.window);
    const cursor = screen.getCursorScreenPoint();
    const ar = this.settings.language === 'ar';
    this.win.webContents.send('overlay:content', {
      mode: this.state.view, language: this.settings.language, playing: this.state.playing,
      layout, cursor: { x: cursor.x - layout.window.x, y: cursor.y - layout.window.y },
      next: this.summary.next.label, countdown: countdownClock(this.summary.next.at - this.now),
      nextLabel: ar ? 'الصلاة القادمة' : 'Next prayer', location: this.settings.location.name, rows: this.summary.rows,
      today: ar ? 'مواقيت اليوم' : "Today's times", settings: ar ? 'الإعدادات' : 'Settings',
      open: ar ? 'فتح' : 'Open', stop: ar ? 'إيقاف الصوت' : 'Stop sound', dismiss: ar ? 'طي' : 'Collapse',
      title: this.state.alert?.title || '', body: this.state.alert?.body || '',
    });
    if (!this.win.isVisible()) this.win.showInactive();
  }
  owns(event) { return this.win && !this.win.isDestroyed() && event.sender === this.win.webContents; }
}
module.exports = { PrayerOverlay };
