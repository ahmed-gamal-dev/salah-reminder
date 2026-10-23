import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const { identity, appUserModelId, storeVersion } = require('../src/core/windows-store');

describe('Microsoft Store association', () => {
  it('maps source versions to increasing Store versions with a nonzero major', () => {
    expect(storeVersion('0.1.4')).toBe('1.1.4');
    expect(storeVersion('1.0.0')).toBe('2.0.0');
    expect(() => storeVersion('1.0.0-beta')).toThrow();
    expect(() => storeVersion('65535.0.0')).toThrow();
  });
  it('matches the reserved package family to the publisher certificate subject', () => {
    const bits = [...createHash('sha256').update(identity.publisher, 'utf16le').digest().subarray(0, 8)].map(n => n.toString(2).padStart(8, '0')).join('') + '0';
    const alphabet = '0123456789abcdefghjkmnpqrstvwxyz';
    let publisherId = '';
    for (let i = 0; i < bits.length; i += 5) publisherId += alphabet[parseInt(bits.slice(i, i + 5), 2)];
    expect(identity.packageFamilyName).toBe(`${identity.name}_${publisherId}`);
  });
  it('uses the Store application identity for packaged notifications and retains the direct-download identity', () => {
    expect(appUserModelId(true)).toBe('AhmedGamalEissa.53203B7362789_ed4k8f7j7wyv0!SalahReminder');
    expect(appUserModelId(false)).toBe('io.github.salah-reminder');
    expect(appUserModelId(undefined)).toBe('io.github.salah-reminder');
  });
  it('does not write virtualized login registry entries from a Store package', () => {
    let writes = 0;
    const context = { module: { exports: {} }, process: { platform: 'win32', windowsStore: true, env: {} },
      require(name) { return name === 'electron' ? { app: { isPackaged: true, setLoginItemSettings() { writes++; } } } : require(name); } };
    vm.runInNewContext(fs.readFileSync(new URL('../src/main/autostart.js', import.meta.url), 'utf8'), context);
    context.module.exports.setAutostart(true); context.module.exports.setAutostart(false);
    expect(writes).toBe(0);
    context.process.windowsStore = false; context.module.exports.setAutostart(true);
    expect(writes).toBe(1);
  });
});
