'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('salah', {
  getState: () => ipcRenderer.invoke('state:get'),
  save: (settings) => ipcRenderer.invoke('settings:save', settings),
  detectLocation: () => ipcRenderer.invoke('geo:detect'),
  pickSound: () => ipcRenderer.invoke('sound:pick'),
  testNotification: () => ipcRenderer.invoke('notify:test'),
  getAdhkar: (category) => ipcRenderer.invoke('adhkar:get', category),
  previewBanner: () => ipcRenderer.invoke('overlay:preview'),
  testSound: () => ipcRenderer.invoke('sound:test'),
  stopSound: () => ipcRenderer.invoke('sound:stop'),
  onPlaySound: (cb) => ipcRenderer.on('sound:play', (_e, payload) => cb(payload)),
  onStopSound: (cb) => ipcRenderer.on('sound:stop', () => cb()),
  soundStarted: (info) => ipcRenderer.send('sound:started', info),
  soundEnded: () => ipcRenderer.send('sound:ended'),
  onStateChanged: (cb) => ipcRenderer.on('state:changed', () => cb()),
});
