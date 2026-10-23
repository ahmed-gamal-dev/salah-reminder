'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { app } = require('electron');

const LINUX_FILE = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'autostart', 'salah-reminder.desktop');

function setAutostart(enabled) {
  if (!app.isPackaged) return; // never register the dev electron binary as a login item
  if (process.platform === 'linux') {
    if (!enabled) return fs.rmSync(LINUX_FILE, { force: true });
    const exec = process.env.APPIMAGE || process.execPath;
    fs.mkdirSync(path.dirname(LINUX_FILE), { recursive: true });
    fs.writeFileSync(LINUX_FILE, `[Desktop Entry]\nType=Application\nName=Salah Reminder\nExec="${exec}" --hidden\nX-GNOME-Autostart-enabled=true\nTerminal=false\n`);
    return;
  }
  app.setLoginItemSettings({ openAtLogin: enabled, args: ['--hidden'] });
}

module.exports = { setAutostart };
