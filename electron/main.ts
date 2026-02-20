import { app, BrowserWindow, net, protocol, session } from 'electron';
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
  'https://www.digiloglabs.com/auth/signin?redirect=electron&callback=digiloglabs-agents://auth';

let mainWindow: BrowserWindow | null = null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'digiloglabs-agents',
    privileges: { standard: true, secure: true },
  },
]);

if (!app.isDefaultProtocolClient('digiloglabs-agents')) {
  app.setAsDefaultProtocolClient('digiloglabs-agents');
}

function handleAuthCallback(url: string): void {
  if (!app.isPackaged) {
    console.log('[auth] handleAuthCallback received:', url.slice(0, 80) + '...');
  }
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    if (token) {
      keystore.setDigilogToken(token);
      mainWindow?.webContents.send('auth:token-received', token);
      getLoginWindowRef()?.close();
      setLoginWindowRef(null);
      if (!app.isPackaged) {
        console.log('[auth] Token saved, login window closed');
      }
    }
  } catch {
    /* ignore */
  }
}

function setupAuthNavigationListeners(): void {
  app.on('web-contents-created', (_e, contents) => {
    const tryHandleAuth = (url: string) => {
      if (url.startsWith('digiloglabs-agents://')) {
        handleAuthCallback(url);
        return true;
      }
      return false;
    };

    contents.on('will-navigate', (event, url) => {
      if (tryHandleAuth(url)) event.preventDefault();
    });
    contents.on('will-redirect', (event, url) => {
      if (tryHandleAuth(url)) event.preventDefault();
    });
  });
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
    if (!app.isPackaged) {
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow?.loadURL(getFallbackUrl());
  });
}

app.whenReady().then(async () => {
  setupAuthNavigationListeners();

  const argvUrl = process.argv.find(arg => arg.startsWith('digiloglabs-agents://'));
  if (argvUrl) handleAuthCallback(argvUrl);

  const protocolHandler = (request: { url: string }) => {
    handleAuthCallback(request.url);
    return new Response(
      '<!DOCTYPE html><html><body><h2>로그인 완료. 이 창을 닫아주세요.</h2></body></html>',
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  };

  session.defaultSession.protocol.handle('digiloglabs-agents', protocolHandler);

  await createWindow();
  registerIpcHandlers(mainWindow, handleAuthCallback);
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
