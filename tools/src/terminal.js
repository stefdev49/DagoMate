#!/usr/bin/env node
'use strict';

const version = require('../package.json').version;
const SerialPort = require('serialport/lib/');
const args = require('commander');
const fs = require('fs');

function makeNumber(input) {
  return Number(input);
}

args
  .version(version)
  .usage('-p <port> [options]')
  .description('A basic terminal interface for communicating over a serial port. Pressing ctrl+c exits.')
  .option('-l --list', 'List available ports then exit')
  // TODO make the port not a flag as it's always required
  .option('-p, --port <port>', 'Path or Name of serial port', '/dev/ttyUSB0')
  .option('-b, --baud <baudrate>', 'Baud rate default: 9600', makeNumber, 250000)
  .option('--databits <databits>', 'Data bits default: 8', makeNumber, 8)
  .option('--parity <parity>', 'Parity default: none', 'none')
  .option('--stopbits <bits>', 'Stop bits default: 1', makeNumber, 1)
  .option('--record <filename>', 'Record session to file default: session.log', 'session.log')
  .parse(process.argv);

function listPorts() {
  SerialPort.list((err, ports) => {
    if (err) {
      console.error('Error listing ports', err);
    } else {
      ports.forEach((port) => {
        console.log(`${port.comName}\t${port.pnpId || ''}\t${port.manufacturer || ''}`);
      });
    }
  });
};

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

  process.stdin.resume();
  process.stdin.setRawMode(true);
  process.stdin.on('data', (s) => {
    if (s[0] === 0x03) {
      port.close();
      process.exit(0);
    }

    // echo to console
    if (s[0] === 0x0d) {
      process.stdout.write('\n');
      recorder.write('\n');
    } else {
      process.stdout.write(s);
      recorder.write(s);
    }

    port.write(s);
  });

  port.on('data', (data) => {
    process.stdout.write(data.toString());
    // record data
    recorder.write(data.toString());
  });

  port.on('error', (err) => {
    console.log('Error', err);
    process.exit(1);
  });
}

if (args.list) {
  listPorts();
} else {
  createPort();
}
