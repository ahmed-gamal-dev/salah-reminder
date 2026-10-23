'use strict';
// Public package identity from the owner's Microsoft Partner Center reservation.
const identity = Object.freeze({
  name: 'AhmedGamalEissa.53203B7362789',
  publisher: 'CN=85DB4DCB-0BB5-4D72-8B61-6EFD02B02E0D',
  publisherDisplayName: 'Ahmed Gamal Eissa',
  packageFamilyName: 'AhmedGamalEissa.53203B7362789_ed4k8f7j7wyv0',
  applicationId: 'SalahReminder',
  displayName: 'مواقيت الصلاة والأذكار',
  storeId: '9PHFZ849MQFQ',
});
function appUserModelId(isStore) {
  return isStore ? `${identity.packageFamilyName}!${identity.applicationId}` : 'io.github.salah-reminder';
}
// Store requires a nonzero major and reserves the fourth component as zero.
// Add one to the source major consistently, including after the source reaches 1.x.
function storeVersion(source) {
  if (!/^\d+\.\d+\.\d+$/.test(source)) throw new Error('Expected a stable three-part source version');
  const parts = source.split('.').map(Number); parts[0]++;
  if (parts.some(n => !Number.isInteger(n) || n < 0 || n > 65535)) throw new Error('Store version component out of range');
  return parts.join('.');
}
module.exports = { identity, appUserModelId, storeVersion };
