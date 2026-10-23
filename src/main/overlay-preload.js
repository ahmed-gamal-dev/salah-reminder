'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('banner', {
  onContent: (cb) => ipcRenderer.on('overlay:content', (_e, data) => cb(data)),
  dismiss: () => ipcRenderer.send('overlay:dismiss'),
  stop: () => ipcRenderer.send('overlay:stop'),
  open: () => ipcRenderer.send('overlay:open'),
});
