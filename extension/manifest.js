'use strict';

const GECKO_ID = 'salah-reminder@ahmed-gamal-dev.github.io';

/** One manifest template for both browsers; only the background declaration and Gecko settings differ. */
function buildManifest(target, version) {
  if (!['chrome', 'firefox'].includes(target)) throw new Error(`Unknown target: ${target}`);
  const manifest = {
    manifest_version: 3,
    name: 'Salah Reminder · مواقيت الصلاة',
    short_name: 'Salah Reminder',
    version,
    description: 'Offline prayer times, countdown, adhan notifications and adhkar reminders. مواقيت الصلاة والأذكار بدون إنترنت.',
    icons: { 16: 'icons/icon16.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png' },
    action: { default_title: 'Salah Reminder', default_popup: 'popup.html', default_icon: { 16: 'icons/icon16.png', 48: 'icons/icon48.png' } },
    options_ui: { page: 'options.html', open_in_tab: true },
    permissions: ['alarms', 'notifications', 'storage'],
  };
  if (target === 'chrome') {
    manifest.background = { service_worker: 'background.js' };
    manifest.minimum_chrome_version = '116';
  } else {
    manifest.background = { scripts: ['background.js'] };
    manifest.browser_specific_settings = { gecko: { id: GECKO_ID, strict_min_version: '128.0', data_collection_permissions: { required: ['none'] } } };
  }
  return manifest;
}

module.exports = { buildManifest, GECKO_ID };
