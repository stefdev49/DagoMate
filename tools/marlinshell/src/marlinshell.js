#!/usr/bin/env node
'use strict';

const version = require('../package.json').version;
const SerialPort = require('serialport/lib/');
const args = require('commander');
const fs = require('fs');
const Gui = require('../src/gui.js');

// serial port
var port;

// gui module instance
var gui;

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
    gui = new Gui(port, recorder, true);
    gui.start();
  });

  // data ready event
  port.on('data', (data) => {
    var message = data.toString();

    // record data
    recorder.write(message);

    // output to console window
    gui.consoleOutput(message);
  });

  port.on('error', (err) => {
    console.log('Error', err);
    process.exit(1);
  });
}

// start main loop
createPort();
