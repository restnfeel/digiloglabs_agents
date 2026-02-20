import { ipcMain, BrowserWindow } from 'electron';
import { keystore } from './keystore';
import { registerFsHandlers } from './localfs';

let mainWindowRef: BrowserWindow | null = null;
let loginWindowRef: BrowserWindow | null = null;

export function getLoginWindowRef(): BrowserWindow | null {
  return loginWindowRef;
}

export function setLoginWindowRef(win: BrowserWindow | null): void {
  loginWindowRef = win;
}

export function registerIpcHandlers(mainWindow: BrowserWindow | null): void {
  mainWindowRef = mainWindow;
  registerFsHandlers();

  ipcMain.handle('keys:get-openrouter', () => keystore.getOpenRouterKey());
  ipcMain.handle('keys:set-openrouter', (_event, key: string) =>
    keystore.setOpenRouterKey(key)
  );
  ipcMain.handle('keys:delete-openrouter', () =>
    keystore.deleteOpenRouterKey()
  );
  ipcMain.handle('keys:get-custom', (_event, name: string) =>
    keystore.getCustomKey(name)
  );
  ipcMain.handle('keys:set-custom', (_event, name: string, value: string) =>
    keystore.setCustomKey(name, value)
  );

  ipcMain.handle('auth:get-token', () => keystore.getDigilogToken());
  ipcMain.handle('auth:logout', () => keystore.clearDigilogToken());
  ipcMain.handle('auth:open-login', () => {
    const win = mainWindowRef;
    const loginWin = new BrowserWindow({
      width: 480,
      height: 680,
      modal: !!win,
      parent: win ?? undefined,
      webPreferences: { nodeIntegration: false },
    });
    setLoginWindowRef(loginWin);
    loginWin.on('closed', () => setLoginWindowRef(null));
    loginWin.loadURL(
      'https://digiloglabs.com/auth/signin?redirect=electron&callback=digiloglabs-agents://auth'
    );
  });

  ipcMain.handle('app:version', () => {
    return process.env.npm_package_version ?? '0.1.0';
  });
  ipcMain.handle('app:check-update', () => {
    return Promise.resolve();
  });
}
