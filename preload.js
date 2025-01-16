const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appMonitor', {
    onUpdateApps: (callback) => ipcRenderer.on('update-apps', (_, data) => callback(data)),
    onAppsStarted: (callback) => ipcRenderer.on('apps-started', (_, data) => callback(data)),
    onAppsClosed: (callback) => ipcRenderer.on('apps-closed', (_, data) => callback(data))
});