'use strict';
const { sanitize } = require('../../src/core/settings');
const { buildEvents } = require('../../src/core/scheduler');
const { buildSummary } = require('../../src/core/summary');
const { planAlarms, badgeText, notificationFor } = require('./schedule');

const api = globalThis.browser || globalThis.chrome;
const STALE_MS = 5 * 60 * 1000; // browser was asleep: skip notifications that are long past

async function getSettings() {
  const { settings } = await api.storage.local.get('settings');
  return sanitize(settings);
}

async function updateBadge() {
  const settings = await getSettings();
  const { next } = buildSummary(new Date(), settings);
  await api.action.setBadgeText({ text: badgeText(next.msUntil) });
  await api.action.setBadgeBackgroundColor({ color: '#0f4c3a' });
  await api.action.setTitle({ title: `${next.label} ${next.time} (${next.countdown})` });
}

async function reschedule() {
  const settings = await getSettings();
  await api.alarms.clearAll();
  for (const a of planAlarms(new Date(), settings)) api.alarms.create(a.name, { when: a.when });
  api.alarms.create('refresh', { periodInMinutes: 360 });
  api.alarms.create('badge', { periodInMinutes: 1 });
  await updateBadge();
}

async function fire(id) {
  const settings = await getSettings();
  const now = new Date();
  const event = buildEvents(now, settings).find((e) => e.id === id);
  if (!event || now - event.at > STALE_MS) return;
  const n = notificationFor(event, settings);
  if (!n) return;
  const nid = n.category ? `adhkar-${n.category}` : id;
  await api.notifications.create(nid, { type: 'basic', iconUrl: 'icons/icon128.png', title: n.title, message: n.message });
}

api.runtime.onInstalled.addListener(reschedule);
api.runtime.onStartup.addListener(reschedule);
api.storage.onChanged.addListener((changes) => { if (changes.settings) reschedule(); });
api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('ev:')) fire(alarm.name.slice(3));
  else if (alarm.name === 'refresh') reschedule();
  else if (alarm.name === 'badge') updateBadge();
});
api.notifications.onClicked.addListener((nid) => {
  if (nid.startsWith('adhkar-')) api.tabs.create({ url: api.runtime.getURL(`adhkar.html?category=${nid.slice(7)}`) });
  api.notifications.clear(nid);
});
