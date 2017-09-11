#!/usr/bin/env node

const version = require('../package.json').version;
const SerialPort = require('serialport/lib/');
const args = require('commander');
const fs = require('fs');

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const screen = blessed.screen({
    // Example of optional settings:
    smartCSR: true,
    useBCE: true,
    cursor: {
        artificial: true,
        blink: true,
        shape: 'underline'
    },
    log: `${__dirname}/application.log`,
    debug: true,
    dockBorders: true
});

// remainder of last printer's message
var remain = '';

// argument parsing
function makeNumber(input) {
  return Number(input);
}

args
  .version(version)
  .usage('-p <port> [options]')
  .description('A basic terminal interface for communicating over a serial port. Pressing ctrl+c exits.')
  .option('-l --list', 'List available ports then exit')
  .option('-p, --port <port>', 'Path or Name of serial port', '/dev/ttyUSB0')
  .option('-b, --baud <baudrate>', 'Baud rate default: 9600', makeNumber, 250000)
  .option('--databits <databits>', 'Data bits default: 8', makeNumber, 8)
  .option('--parity <parity>', 'Parity default: none', 'none')
  .option('--stopbits <bits>', 'Stop bits default: 1', makeNumber, 1)
  .option('--record <filename>', 'Record session to file default: session.log', 'session.log')
  .parse(process.argv);

// build ui
screen.title = 'Marlin shell';

// status line
const statusbar = blessed.box(
  {
    height: 1,
    top: 0,
    fg: 'green',
    selectedFg: 'green',
    tags: true
});
screen.append(statusbar);

// message display area
const log = contrib.log(
      {
        top: 1,
        bottom: 3,
        fg: 'green',
        selectedFg: 'green',
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
  return process.exit(0);
});

// If box is focused, handle `Enter`.
input.key('enter', function(ch, key) {
    var message = this.getValue();
    if(message === 'exit') {
      return process.exit(0);
    }
    log.log(message);
    this.clearValue();
    screen.render();
    this.focus();
});

function createPort() {
  if (!args.port) {
    args.outputHelp();
    args.missingArgument('port');
    process.exit(-1);
  }

  // setup logging file
  const recorder = fs.createWriteStream(args.record);

  const openOptions = {
    baudRate: args.baud,
    dataBits: args.databits,
    parity: args.parity,
    stopBits: args.stopbits
  };

  const port = new SerialPort(args.port, openOptions);

  port.on('data', (data) => {
    var message = remain + data.toString();
    // record data
    recorder.write(message);
    // send to console window
    lines = message.split(/\r?\n/g);
    lines.forEach((element) => {
      log.log(element);
      screen.render();
    });
  });

  port.on('error', (err) => {
    console.log('Error', err);
    process.exit(1);
  });
}

createPort();
input.focus();
screen.render();
