'use strict';
const path = require('path');
const { BrowserWindow, screen } = require('electron');
const { overlayBounds } = require('../core/overlay');

/** Optional top-center banner. showInactive keeps the user's current app focused. */
class PrayerOverlay {
  constructor() { this.win = null; this.timer = null; this.payload = null; }
  show(payload) {
    this.payload = payload;
    if (!this.win || this.win.isDestroyed()) {
      this.win = new BrowserWindow({
        ...overlayBounds(this.display()), show: false, frame: false, transparent: true,
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
    } else if (!this.win.webContents.isLoading()) this.present();
  }
  display() { return screen.getAllDisplays().find((d) => d.internal) || screen.getPrimaryDisplay(); }
  present() {
    this.win.setBounds(overlayBounds(this.display()));
    this.win.webContents.send('overlay:content', this.payload);
    this.win.showInactive();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.hide(), 15000);
  }
  hide() { clearTimeout(this.timer); if (this.win && !this.win.isDestroyed()) this.win.hide(); }
  owns(event) { return this.win && !this.win.isDestroyed() && event.sender === this.win.webContents; }
}
module.exports = { PrayerOverlay };
