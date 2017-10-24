'use strict';
/**
 * gui module resposible for building and updating the gui
 * Constructor pattern
 */
function Gui(_port, _recorder, _state) {

const blessed = require('blessed');
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

// serial port to 3D printer
var port = _port;

// I/O logging facility
var recorder = _recorder;

// true when the USB serial is connected to a printer
var connected = _state;

// remainder of last printer's message
var remain = '';

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

// index in command history
var hindex = 0;

// command history
var history = [];


// status line
const statusbar = blessed.box(
  {
    height: 1,
    top: 0,
    fg: 'black',
    bg: 'white',
    tags: true
});

// message display area
const log = blessed.log(
      {
        top: 1,
        bottom: 2,
        fg: 'white',
        selectedFg: 'white',
        label: 'Printer console',
        border: {type: 'line', fg: 'cyan'},
        scrollable: true,
        scrollbar: {
          bg: 'blue'
        },
        mouse: true,
        tags: true
    });

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

// global exit
input.key(['C-d', 'C-c'], function(ch, key) {
  recorder.close();
  return process.exit(0);
});

// command history handling
input.key(['up', 'down'], function(ch, key) {
  if(hindex > 0 && key.name === 'up') {
    hindex--;
  }
  if(hindex < history.length-1 && key.name === 'down') {
    hindex++;
  }
  this.setValue(history[hindex]);
  screen.render();
  this.focus();
});

// if box is focused, handle `Enter`.
input.key('enter', function(ch, key) {
    var command = this.getValue();
    if(command === 'exit') {
      recorder.close();
      return process.exit(0);
    }
    hindex = history.push(command);
    recorder.write(command+'\n');
    port.write(command+'\n');
    log.log('{green-fg}'+command+'{/green-fg}');
    this.clearValue();
    busy = true;
    updateStatus();
    screen.render();
    this.focus();
});

/**
 * starts gui
 */
function start() {
  // build ui
  screen.title = 'Marlin shell';
  screen.append(statusbar);
  screen.append(log);
  screen.append(input);
  input.focus();
  screen.render();
};

function computeStatusLine () {
  var statusline;

  // marlin status
  if(busy == true) {
    statusline = '{black-fg}{yellow-bg}busy {/yellow-bg}{/black-fg}';
  } else {
    statusline = '{black-fg}{green-bg}ready{/green-bg}{/black-fg}';
  }

  // temperature report
  statusline += ' Hotend:'+htemp+'/'+htarget+'°C  Hotbed:'+btemp+'/'+btarget+'°C  ';

  // connection status
  if(connected == true) {
    statusline += ' {black-fg}{green-bg}connected{/green-bg}{/black-fg}';
  } else {
    statusline += ' {black-fg}{red-bg}disconnected{/red-bg}{/black-fg}';
  }

  return statusline;
}

// display status
function updateStatus () {
  statusbar.setContent(computeStatusLine());
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
      // detect temperature report and hide it from console messages
      if(/ok T:/.test(element) || /^ T:/.test(element)) {
        var temps = element.split(/[: /]/);
        htemp=temps[2];
        htarget=temps[4];
        btemp=temps[6];
        btarget=temps[8];
      } else if(isError(element)) {
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

function destroy() {
  screen.destroy();
}

function getConnected() {
  return connected;
}

// export these functions
this.computeStatusLine = computeStatusLine;
this.consoleOutput = consoleOutput;
this.updateStatus = updateStatus;
this.isReady = isReady;
this.isError = isError;
this.start = start;
this.destroy = destroy;
this.getConnected = getConnected;

}

module.exports = Gui;
