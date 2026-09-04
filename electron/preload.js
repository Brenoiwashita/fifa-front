const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  selectFcPath: () => ipcRenderer.invoke('fc:select-path'),
  fc26: {
    getDefaultPaths: () => ipcRenderer.invoke('fc26:default-paths'),
    scanSaves: (rootPath, options) => ipcRenderer.invoke('fc26:scan-saves', rootPath, options),
    inspectSave: (filePath) => ipcRenderer.invoke('fc26:inspect-save', filePath),
    selectSaveFile: () => ipcRenderer.invoke('fc26:select-save-file'),
    parseSave: (filePath) => ipcRenderer.invoke('fc26:parse-save', filePath),
    loadDemo: () => ipcRenderer.invoke('fc26:load-demo'),
  },
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  api: {
    health: (baseUrl) => ipcRenderer.invoke('api:health', baseUrl),
    listCareers: (baseUrl) => ipcRenderer.invoke('api:list-careers', baseUrl),
    getDashboard: (baseUrl, careerId) => ipcRenderer.invoke('api:get-dashboard', baseUrl, careerId),
    getPlayers: (baseUrl, careerId) => ipcRenderer.invoke('api:get-players', baseUrl, careerId),
    getHistory: (baseUrl, careerId, limit) => ipcRenderer.invoke('api:get-history', baseUrl, careerId, limit),
    publishSnapshot: (baseUrl, syncKey, snapshot) => ipcRenderer.invoke('api:publish-snapshot', baseUrl, syncKey, snapshot),
  },
});
