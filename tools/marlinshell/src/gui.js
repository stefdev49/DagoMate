'use strict';
/**
 * gui module resposible for building and updating the gui
 * Constructor pattern
 */
function Gui(port, recorder, state) {

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
var port = port;

// I/O logging facility
var recorder = recorder;

// true when the USB serial is connected to a printer
var connected = state;

// remainder of last printer's message
var remain = '';

this.port = port;
this.recorder = recorder;
this.connected = state;

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
  this.recorder.close();
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
this.computeStatusLine = computeStatusLine;

// display status
function updateStatus () {
  statusbar.setContent(computeStatusLine());
  screen.render();
}

// make it public
this.updateStatus = updateStatus;

// return true when the printer is ready after this message
this.isReady = function (message) {
  return /^ok /.test(message) || /^echo:SD init/.test(message) || /Unknown/.test(message) || /Invalid/.test(message);
}

// return true if the message is an error message
this.isError = function (message) {
  return /Home XYZ first/.test(message) || /fail/.test(message);
}

// outputs multi-line message to console window
this.consoleOutput = function (message) {
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
      } else if(this.isError(element)) {
        log.log('{red-fg}'+element+'{/red-fg}');
      } else {
        log.log(element);
      }
      if(this.isReady(element)) {
        busy = false;
      }
      screen.render();
    }
  });

  // update status
  this.updateStatus();
}

/**
 * starts gui
 */
this.start = function () {
  input.focus();
  screen.render();
};

}

module.exports = Gui;
