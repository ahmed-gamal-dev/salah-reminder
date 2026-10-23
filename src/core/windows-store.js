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
module.exports = { identity, appUserModelId };
