'use strict';
const base = require('../package.json').build;
const { identity, storeVersion } = require('../src/core/windows-store');
module.exports = {
  ...base,
  toolsets: { winCodeSign: '1.1.0' },
  extraMetadata: { version: storeVersion(require('../package.json').version) },
  directories: { ...base.directories, output: 'dist-store' },
  win: { ...base.win, target: [{ target: 'appx', arch: ['x64'] }], signExecutable: false },
  appx: {
    identityName: identity.name,
    publisher: identity.publisher,
    publisherDisplayName: identity.publisherDisplayName,
    displayName: identity.displayName,
    applicationId: identity.applicationId,
    artifactName: 'Salah-Reminder-Store-${version}-${arch}.${ext}',
    languages: ['ar-SA', 'en-US'],
    minVersion: '10.0.19041.0',
    maxVersionTested: '10.0.26100.0',
    capabilities: ['runFullTrust'],
    addAutoLaunchExtension: false,
    customExtensionsPath: 'build/windows-store-startup.xml',
    setBuildNumber: false,
  },
};
