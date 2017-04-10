import { app, BrowserWindow } from 'electron';

export const connMenuTemplate = {
  label: 'Serial port',
  submenu: [{
    label: 'Select port',
    accelerator: 'CmdOrCtrl+R',
    click: () => {
      BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
    },
  },
  { type: 'separator' },
  {
    label: 'Connect',
    accelerator: 'Alt+CmdOrCtrl+C',
    click: () => {
      BrowserWindow.getFocusedWindow().toggleDevTools();
    },
  },
  {
    label: 'Disconnect',
    accelerator: 'CmdOrCtrl+D',
    click: () => {
      app.quit();
    },
  }],
};
