// Here is the starting point for your application code.

// Small helpers you might want to keep
import './helpers/context_menu.js';
import './helpers/external_links.js';

// All stuff below is just to show you how it works. You can delete all of it.
import { remote } from 'electron';
import jetpack from 'fs-jetpack';
import { greet } from './hello_world/hello_world';
import env from './env';

import serialport from 'serialport';

// Importing jQuery in ES6 style
import $ from "jquery";

// We need to expose jQuery as global variable
window.jQuery = window.$ = $;

// ES6 import does not work it throws error: Missing jQuery
// using Node.js style import works without problems
require('bootstrap');

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files form disk like it's node.js! Welcome to Electron world :)
const manifest = appDir.read('package.json', 'json');

const osMap = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
};

document.querySelector('#greet').innerHTML = greet();
document.querySelector('#os').innerHTML = osMap[process.platform];
document.querySelector('#author').innerHTML = manifest.author;
document.querySelector('#env').innerHTML = env.name;
document.querySelector('#electron-version').innerHTML = process.versions.electron;

serialport.list((err, ports) => {
  console.log('ports', ports);
  if (err) {
    $('#portslisterror').removeClass('hidden')
    $('#portslisterror').text(err.message)
    return
  } else {
    $('#portslisterror').addClass('hidden')
    ports.forEach(port => $('#portslist').append('<li class="list-group-item">' + port.comName + '</li>'))
  }
  /**
  comName : "/dev/ttyUSB0"
  manufacturer : "FTDI"
  pnpId : "usb-FTDI_FT232R_USB_UART_A105W3PW-if00-port0"
  productId : "0x6001"
  serialNumber : "FTDI_FT232R_USB_UART_A105W3PW"
  vendorId : "0x0403"
  */
  if (ports.length === 0) {
    document.getElementById('error').textContent = 'No ports discovered'
  }
})
