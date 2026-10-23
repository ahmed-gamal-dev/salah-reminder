'use strict';
const { net } = require('electron');

/** Approximate location from the public IP. Only called when the user presses "Detect". */
async function detectLocation() {
  const res = await net.fetch('https://ipwho.is/?fields=success,city,latitude,longitude,timezone', { signal: AbortSignal.timeout(8000) });
  const j = await res.json();
  if (!j.success || typeof j.latitude !== 'number') throw new Error('lookup failed');
  return { name: j.city || 'My location', lat: j.latitude, lng: j.longitude, timeZone: (j.timezone && j.timezone.id) || 'auto' };
}

module.exports = { detectLocation };
