import { app, BrowserWindow, net } from 'electron';
import path from 'path';
import { createTray } from './tray';
import {
  registerIpcHandlers,
  getLoginWindowRef,
  setLoginWindowRef,
} from './ipc-handlers';
import { setupAutoUpdater } from './updater';
import { keystore } from './keystore';

const REMOTE_UI_URL = 'https://digiloglabs.com/agi';
const LOGIN_URL =
  'https://digiloglabs.com/auth/signin?redirect=electron&callback=digiloglabs-agents://auth';

let mainWindow: BrowserWindow | null = null;

if (!app.isDefaultProtocolClient('digiloglabs-agents')) {
  app.setAsDefaultProtocolClient('digiloglabs-agents');
}

function handleAuthCallback(url: string): void {
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    if (token) {
      keystore.setDigilogToken(token);
      mainWindow?.webContents.send('auth:token-received', token);
      getLoginWindowRef()?.close();
      setLoginWindowRef(null);
    }
  } catch {
    /* ignore */
  }
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv: string[]) => {
    const url = argv.find(arg => arg.startsWith('digiloglabs-agents://'));
    if (url) handleAuthCallback(url);
    mainWindow?.show();
  });
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleAuthCallback(url);
});

function getFallbackUrl(): string {
  return `file://${path.join(__dirname, '../fallback/index.html')}`;
}

async function isOnline(): Promise<boolean> {
  return new Promise(resolve => {
    const req = net.request({ url: REMOTE_UI_URL, method: 'HEAD' });
    req.on('response', () => resolve(true));
    req.on('error', () => resolve(false));
    req.end();
    setTimeout(() => resolve(false), 3000);
  });
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, '../resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  const online = await isOnline();
  const loadUrl = online ? REMOTE_UI_URL : getFallbackUrl();

  mainWindow.loadURL(loadUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (!online) {
      mainWindow?.webContents.send('app:offline-mode', true);
    }
  });

  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow?.loadURL(getFallbackUrl());
  });
}

app.whenReady().then(async () => {
  await createWindow();
  registerIpcHandlers(mainWindow);
  if (mainWindow) {
    createTray(mainWindow);
    setupAutoUpdater(mainWindow);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
