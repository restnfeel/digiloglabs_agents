import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';

const defaultFilters = [
  { name: '문서', extensions: ['txt', 'md', 'pdf', 'docx', 'csv', 'json'] },
  { name: '이미지', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
  { name: '모든 파일', extensions: ['*'] },
];

export function registerFsHandlers(): void {
  ipcMain.handle(
    'fs:select-file',
    async (
      _,
      options?: {
        properties?: ('openFile' | 'multiSelections')[];
        filters?: { name: string; extensions: string[] }[];
      }
    ) => {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: options?.filters ?? defaultFilters,
      });
      return result.canceled ? [] : result.filePaths;
    }
  );

  ipcMain.handle('fs:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('fs:read-file', async (_, filePath: string) => {
    const content = await fs.readFile(filePath, 'utf-8');
    return { path: filePath, name: path.basename(filePath), content };
  });

  ipcMain.handle('fs:list-folder', async (_, folderPath: string) => {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    return entries.map(e => ({
      name: e.name,
      path: path.join(folderPath, e.name),
      isDirectory: e.isDirectory(),
    }));
  });
}
