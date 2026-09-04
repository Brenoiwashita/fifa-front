const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { findExistingDefaultPaths, scanDirectory } = require('./services/fc26/save-discovery.service');
const { inspectSaveFile } = require('./services/fc26/save-reader.service');
const { parseCareerSave } = require('./services/fc26/career-parser.service');
const { getDemoSavePath } = require('./services/fc26/demo-save.service');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 920,
    minWidth: 1180,
    minHeight: 720,
    frame: false,
    backgroundColor: '#0e141c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'fc-career-hub', 'browser', 'index.html'));
}

function normalizeBaseUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('API_URL_INVALID');
  }
  return parsed.toString().replace(/\/$/, '');
}

async function apiRequest({ baseUrl, endpoint, method = 'GET', syncKey, body }) {
  try {
    const url = `${normalizeBaseUrl(baseUrl)}${endpoint}`;
    const headers = { Accept: 'application/json' };

    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (syncKey) headers['x-sync-key'] = syncKey;

    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: typeof data === 'object' && data?.error ? data.error : `HTTP_${response.status}`,
        data,
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'API_UNAVAILABLE',
    };
  }
}

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:toggle-maximize', () => (mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize()));
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('app:info', () => ({ version: app.getVersion(), platform: process.platform }));

ipcMain.handle('fc:select-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Selecione a pasta do EA Sports FC 26',
  });
  return result.canceled ? null : result.filePaths[0];
});

// Acesso local ao FC 26. O renderer recebe somente operações de domínio, nunca fs genérico.
ipcMain.handle('fc26:default-paths', async () => findExistingDefaultPaths());

ipcMain.handle('fc26:scan-saves', async (_event, rootPath, options = {}) => {
  try {
    const data = await scanDirectory(rootPath, options);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'FC26_SCAN_FAILED' };
  }
});

ipcMain.handle('fc26:inspect-save', async (_event, filePath) => {
  try {
    const data = await inspectSaveFile(filePath);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'FC26_INSPECT_FAILED' };
  }
});

ipcMain.handle('fc26:select-save-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'Selecione um save de carreira do EA Sports FC 26',
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('fc26:parse-save', async (_event, filePath) => {
  try {
    const data = await parseCareerSave(filePath);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error?.userMessage || (error instanceof Error ? error.message : 'FC26_PARSE_FAILED'),
    };
  }
});

ipcMain.handle('fc26:load-demo', async () => {
  try {
    const filePath = getDemoSavePath();
    const data = await parseCareerSave(filePath);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'FC26_DEMO_FAILED' };
  }
});

// Chamadas de domínio para a API central. O renderer nunca recebe fetch/Node diretamente.
ipcMain.handle('api:health', (_event, baseUrl) =>
  apiRequest({ baseUrl, endpoint: '/health' })
);

ipcMain.handle('api:list-careers', (_event, baseUrl) =>
  apiRequest({ baseUrl, endpoint: '/api/careers' })
);

ipcMain.handle('api:get-dashboard', (_event, baseUrl, careerId) =>
  apiRequest({ baseUrl, endpoint: `/api/careers/${encodeURIComponent(careerId)}/dashboard` })
);

ipcMain.handle('api:get-players', (_event, baseUrl, careerId) =>
  apiRequest({ baseUrl, endpoint: `/api/careers/${encodeURIComponent(careerId)}/players` })
);

ipcMain.handle('api:get-history', (_event, baseUrl, careerId, limit = 20) =>
  apiRequest({
    baseUrl,
    endpoint: `/api/careers/${encodeURIComponent(careerId)}/history?limit=${Math.min(Math.max(Number(limit) || 20, 1), 100)}`,
  })
);

ipcMain.handle('api:publish-snapshot', (_event, baseUrl, syncKey, snapshot) =>
  apiRequest({
    baseUrl,
    endpoint: '/api/sync/snapshots',
    method: 'POST',
    syncKey,
    body: snapshot,
  })
);

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
