import { app, BrowserWindow } from 'electron';
import { listPorts } from '../serialport/services';

/**
 * Updates the menu with available serial ports
 */
function updatePortList () {
  let ports = listPorts();
}

export var connMenuTemplate = {
  label: 'Serial port',
  submenu: [{
    label: 'Refresh list',
    accelerator: 'Alt+L',
    click: () => {
      updatePortList();
    },
  },
  {
    label: 'Select',
    submenu: [
      {
        label: '/dev/ttyUSB0',
        type: 'radio'
      },
      {
        label: '/dev/ttyUSB1',
        type: 'radio'
      }
    ]
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
