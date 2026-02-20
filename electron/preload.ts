import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  keys: {
    getOpenRouterKey: () => ipcRenderer.invoke('keys:get-openrouter'),
    setOpenRouterKey: (key: string) =>
      ipcRenderer.invoke('keys:set-openrouter', key),
    deleteOpenRouterKey: () => ipcRenderer.invoke('keys:delete-openrouter'),
    getCustomKey: (name: string) => ipcRenderer.invoke('keys:get-custom', name),
    setCustomKey: (name: string, value: string) =>
      ipcRenderer.invoke('keys:set-custom', name, value),
  },
  fs: {
    selectFile: (options?: {
      properties?: string[];
      filters?: { name: string; extensions: string[] }[];
    }) => ipcRenderer.invoke('fs:select-file', options),
    selectFolder: () => ipcRenderer.invoke('fs:select-folder'),
    readFile: (filePath: string) =>
      ipcRenderer.invoke('fs:read-file', filePath),
    listFolder: (folderPath: string) =>
      ipcRenderer.invoke('fs:list-folder', folderPath),
  },
  auth: {
    openLoginWindow: () => ipcRenderer.invoke('auth:open-login'),
    getToken: () => ipcRenderer.invoke('auth:get-token'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    onAuthTokenReceived: (callback: (token: string) => void) => {
      ipcRenderer.on('auth:token-received', (_event, token: string) =>
        callback(token)
      );
    },
  },
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    checkUpdate: () => ipcRenderer.invoke('app:check-update'),
  },
  platform: process.platform,
});
