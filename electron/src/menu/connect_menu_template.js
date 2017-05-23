import { app, BrowserWindow } from 'electron';
import { listPorts } from '../serialport/services';

export var connMenuTemplate = {
  label: 'Serial port',
  submenu: [
    {
      label: 'Connect',
      accelerator: 'Alt+C',
      click: () => {
        BrowserWindow.getFocusedWindow().toggleDevTools();
      }
    },
    {
      label: 'Disconnect',
      accelerator: 'Alt+D',
      click: () => {
        app.quit();
      }
    }
  ],
};
