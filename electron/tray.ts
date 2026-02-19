import { Tray, Menu, BrowserWindow, nativeImage } from 'electron';
import path from 'path';

export function createTray(mainWindow: BrowserWindow): void {
  const iconPath = path.join(__dirname, '../resources/icon.png');
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 18, height: 18 });

  const tray = new Tray(icon);
  tray.setToolTip('DigiLog Labs Agents');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '열기', click: () => mainWindow.show() },
      {
        label: '새 대화 세션',
        click: () => {
          mainWindow.show();
          mainWindow.webContents.send('navigate', '/agi/chat');
        },
      },
      { type: 'separator' },
      { label: '종료', role: 'quit' },
    ])
  );

  tray.on('double-click', () => mainWindow.show());
}
