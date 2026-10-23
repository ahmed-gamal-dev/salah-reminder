'use strict';
// Manual, direct-download builds only. Store builds have separate packaging requirements.
const base = require('../package.json').build;
module.exports = {
  ...base,
  forceCodeSigning: true,
  asarUnpack: ['assets/macos/notch-metrics'],
  mac: {
    ...base.mac,
    hardenedRuntime: true,
    notarize: true,
    binaries: ['Contents/Resources/app.asar.unpacked/assets/macos/notch-metrics'],
  },
};
