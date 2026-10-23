'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('salah', {
  getState: () => ipcRenderer.invoke('state:get'),
  save: (settings) => ipcRenderer.invoke('settings:save', settings),
  detectLocation: () => ipcRenderer.invoke('geo:detect'),
  pickSound: () => ipcRenderer.invoke('sound:pick'),
  testNotification: () => ipcRenderer.invoke('notify:test'),
  getAdhkar: (category) => ipcRenderer.invoke('adhkar:get', category),
  onPlaySound: (cb) => ipcRenderer.on('sound:play', (_e, url) => cb(url)),
  onStateChanged: (cb) => ipcRenderer.on('state:changed', () => cb()),
});
