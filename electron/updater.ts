import { autoUpdater } from 'electron-updater';
import type { BrowserWindow } from 'electron';

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'restnfeel',
    repo: 'digiloglabs_agents',
  });

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', info => {
    mainWindow.webContents.send('update:available', info);
  });

  autoUpdater.on('update-downloaded', info => {
    mainWindow.webContents.send('update:downloaded', info);
  });
}
