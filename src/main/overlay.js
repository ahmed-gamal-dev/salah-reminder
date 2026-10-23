'use strict';
const path = require('path');
const { BrowserWindow, screen } = require('electron');
const { overlayBounds, countdownClock, OverlayState } = require('../core/overlay');

/** Persistent compact island, with explicit today/alert views. Never activates itself. */
class PrayerOverlay {
  constructor() {
    this.win = null; this.state = new OverlayState(); this.summary = null; this.settings = null; this.now = new Date();
  }
  update(summary, settings, now, playing) {
    this.summary = summary; this.settings = settings; this.now = now;
    this.state.configure(settings.notifications.topBanner);
    this.state.playback(playing);
    this.state.tick(now.getTime());
    this.present();
  }
  show(payload) { this.state.notify(payload, this.now.getTime()); this.present(); }
  toggleToday() { this.state.toggleToday(); this.present(); }
  collapse() { this.state.collapse(); this.present(); }
  display() { return screen.getAllDisplays().find((d) => d.internal) || screen.getPrimaryDisplay(); }
  ensureWindow() {
    if (this.win && !this.win.isDestroyed()) return;
    this.win = new BrowserWindow({
      ...overlayBounds(this.display(), this.state.view), show: false, frame: false, transparent: true,
      resizable: false, movable: false, minimizable: false, maximizable: false,
      alwaysOnTop: true, skipTaskbar: true, hasShadow: false,
      webPreferences: { preload: path.join(__dirname, 'overlay-preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
    this.win.setAlwaysOnTop(true, 'floating');
    this.win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    this.win.webContents.on('will-navigate', (e) => e.preventDefault());
    this.win.loadFile(path.join(__dirname, '..', 'renderer', 'overlay.html'));
    this.win.webContents.once('did-finish-load', () => this.present());
  }
  present() {
    if (!this.summary) return;
    if (!this.state.visible) { if (this.win && !this.win.isDestroyed()) this.win.hide(); return; }
    this.ensureWindow();
    if (this.win.webContents.isLoading()) return;
    const bounds = overlayBounds(this.display(), this.state.view);
    const current = this.win.getBounds();
    if (Object.keys(bounds).some((k) => bounds[k] !== current[k])) this.win.setBounds(bounds);
    const ar = this.settings.language === 'ar';
    this.win.webContents.send('overlay:content', {
      mode: this.state.view, language: this.settings.language, playing: this.state.playing,
      next: this.summary.next.label, countdown: countdownClock(this.summary.next.at - this.now),
      nextLabel: ar ? 'الصلاة القادمة' : 'Next prayer',
      location: this.settings.location.name, rows: this.summary.rows,
      today: ar ? 'مواقيت اليوم' : "Today's times", settings: ar ? 'الإعدادات' : 'Settings',
      open: ar ? 'فتح' : 'Open', stop: ar ? 'إيقاف الصوت' : 'Stop sound',
      dismiss: ar ? 'طي' : 'Collapse',
      title: this.state.alert?.title || '', body: this.state.alert?.body || '',
    });
    if (!this.win.isVisible()) this.win.showInactive();
  }
  owns(event) { return this.win && !this.win.isDestroyed() && event.sender === this.win.webContents; }
}
module.exports = { PrayerOverlay };
