'use strict';

/**
 * Commands that lock the screen, in the order they should be tried.
 * macOS: the old CGSession helper no longer exists on current releases, so we sleep the display
 * (which locks when "Require password after sleep" is on, the default) and fall back to the lock-screen shortcut via System Events.
 */
function lockCommands(platform = process.platform) {
  switch (platform) {
    case 'darwin':
      return [
        { cmd: '/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession', args: ['-suspend'], onlyIfExists: true },
        { cmd: 'pmset', args: ['displaysleepnow'] },
      ];
    case 'win32':
      return [{ cmd: 'rundll32.exe', args: ['user32.dll,LockWorkStation'] }];
    default:
      return [
        { cmd: 'loginctl', args: ['lock-session'] },
        { cmd: 'xdg-screensaver', args: ['lock'] },
        { cmd: 'gnome-screensaver-command', args: ['-l'] },
        { cmd: 'qdbus', args: ['org.freedesktop.ScreenSaver', '/ScreenSaver', 'Lock'] },
      ];
  }
}

/**
 * Try each command until one succeeds. `run(cmd, args)` must resolve on exit code 0 and reject otherwise
 * (injected so the logic is testable without locking a real machine).
 */
async function lockScreen({ platform = process.platform, run, exists = () => true } = {}) {
  const errors = [];
  for (const c of lockCommands(platform)) {
    if (c.onlyIfExists && !exists(c.cmd)) continue;
    try {
      await run(c.cmd, c.args);
      return { ok: true, used: c.cmd };
    } catch (err) {
      errors.push(`${c.cmd}: ${err && err.message}`);
    }
  }
  return { ok: false, errors };
}

module.exports = { lockCommands, lockScreen };
