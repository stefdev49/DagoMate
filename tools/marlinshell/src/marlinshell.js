#!/usr/bin/env node
'use strict';

const version = require('../package.json').version;
const SerialPort = require('serialport/lib/');
const args = require('commander');
const fs = require('fs');

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const screen = blessed.screen({
    smartCSR: true,
    useBCE: true,
    cursor: {
        artificial: true,
        blink: true,
        shape: 'underline'
    },
    dockBorders: true
});

// serail port
var port;

// remainder of last printer's message
var remain = '';

// true if connected to a printer
var connected = false;

// true if printer is busy
var busy = true;

// hotend temperature
var htemp = 0;

// hotend temperature target
var htarget = 0;

// hotbed temperature
var btemp = 0;

// hotbed temperature target
var btarget = 0;



// argument parsing
function makeNumber(input) {
  return Number(input);
}

args
  .version(version)
  .usage('-p <port> [options]')
  .description('A basic shell for communicating to a 3D printer with marlin firmware over a serial port. Pressing ctrl+c or ctrl+d exits.')
  .option('-p, --port <port>', 'Path or Name of serial port', '/dev/ttyUSB0')
  .option('-b, --baud <baudrate>', 'Baud rate default: 9600', makeNumber, 250000)
  .option('--databits <databits>', 'Data bits default: 8', makeNumber, 8)
  .option('--parity <parity>', 'Parity default: none', 'none')
  .option('--stopbits <bits>', 'Stop bits default: 1', makeNumber, 1)
  .option('--record <filename>', 'Record session to file default: session.log', 'session.log')
  .parse(process.argv);

// setup logging file
const recorder = fs.createWriteStream(args.record);

// build ui
screen.title = 'Marlin shell';

// status line
const statusbar = blessed.box(
  {
    height: 1,
    top: 0,
    fg: 'black',
    bg: 'white',
    tags: true
});
screen.append(statusbar);

// message display area
const log = contrib.log(
      {
        top: 1,
        bottom: 3,
        lines: 60,
        fg: 'white',
        selectedFg: 'white',
        label: 'Printer console',
        border: {type: 'line', fg: 'cyan'},
        tags: true
    });
screen.append(log);

// command input area
const input = blessed.textbox(
  {
    height: 3,
    bottom: 0,
    fg: 'green',
    selectedFg: 'green',
    label: 'Command',
    inputOnFocus: true,
    border: {type: 'line', fg: 'cyan'}
});
screen.append(input);

// global exit
input.key(['C-d', 'C-c'], function(ch, key) {
  recorder.close();
  return process.exit(0);
});

// if box is focused, handle `Enter`.
input.key('enter', function(ch, key) {
    var command = this.getValue();
    if(command === 'exit') {
      return process.exit(0);
    }
    recorder.write(command+'\n');
    port.write(command+'\n');
    log.log('{green-fg}'+command+'{/green-fg}');
    busy = true;
    updateStatus();
    this.clearValue();
    screen.render();
    this.focus();
});

// display status
function updateStatus() {
  var statusline;

  // marlin status
  if(busy) {
    statusline = '{black-fg}{yellow-bg}busy {/yellow-bg}{/black-fg}';
  } else {
    statusline = '{black-fg}{green-bg}ready{/green-bg}{/black-fg}';
  }

  // temperature report
  statusline += ' Hotend:'+htemp+'/'+htarget+'°C  Hotbed:'+htemp+'/'+htarget+'°C  ';

  // connection status
  if(connected) {
    statusline += ' {black-fg}{green-bg}connected{/green-bg}{/black-fg}';
  } else {
    statusline += ' {black-fg}{red-bg}disconnected{/red-bg}{/black-fg}';
  }
  statusbar.setContent(statusline);
  screen.render();
}

// return true when the printer is ready after this message
function isReady(message) {
  return /^ok /.test(message) || /^echo:SD init/.test(message) || /Unknown/.test(message) || /Invalid/.test(message);
}

// return true if the message is an error message
function isError(message) {
  return /Home XYZ first/.test(message) || /fail/.test(message);
}

// outputs multi-line message to console window
function consoleOutput(message) {
  // split multi-line message
  var lines = message.split(/\r?\n/g);

  // add remainder from previous display
  lines[0] = remain + lines[0];

  // if last line is incomplete, keep it until next time
  if(/\r?\n$/.test(message) == false) {
    remain = lines.pop();
  } else {
    remain = '';
  }

  // loop to display complete lines
  busy = true;
  lines.forEach((element) => {
    if(element.length>0) {
      // detect temperature report
      if(/ok T:/.test(element)) {
        var temps = element.split(/[: /]/);
        htemp=temps[2];
        htarget=temps[4];
        btemp=temps[6];
        btarget=temps[8];
      }
      if(isError(element)) {
        log.log('{red-fg}'+element+'{/red-fg}');
      } else {
        log.log(element);
      }
      if(isReady(element)) {
        busy = false;
      }
      screen.render();
    }
  });

  // update status
  updateStatus();
}


// connect to printer and setup event handlers
function createPort() {
  if (!args.port) {
    args.outputHelp();
    args.missingArgument('port');
    process.exit(-1);
  }

  const openOptions = {
    baudRate: args.baud,
    dataBits: args.databits,
    parity: args.parity,
    stopBits: args.stopbits
  };

  port = new SerialPort(args.port, openOptions);

  // open port event handler
  port.on('open', (data) => {
    connected = true;
    updateStatus();
  });

  // data ready event
  port.on('data', (data) => {
    var message = data.toString();

    // record data
    recorder.write(message);

    // output to console window
    consoleOutput(message);
  });

  port.on('error', (err) => {
    console.log('Error', err);
    process.exit(1);
  });
}

// start main loop
createPort();
input.focus();
screen.render();
