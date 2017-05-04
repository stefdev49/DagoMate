import { app, BrowserWindow } from 'electron';
import { listPorts } from '../serialport/services';

/**
 * Updates the menu with available serial ports
 */
function updatePortList () {
  listPorts();
}

export var connMenuTemplate = {
  label: 'Serial port',
  submenu: [{
    label: 'Select port',
    accelerator: 'Alt+L',
    click: () => {
      updatePortList();
    },
  },
  { type: 'separator' },
  {
    label: 'Connect',
    accelerator: 'Alt+C',
    click: () => {
      BrowserWindow.getFocusedWindow().toggleDevTools();
    },
  },
  {
    label: 'Disconnect',
    accelerator: 'Alt+D',
    click: () => {
      app.quit();
    },
  }],
};
