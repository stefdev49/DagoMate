#!/usr/bin/env node

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const screen = blessed.screen();

screen.title = 'Marlin shell';

// status line
const statusbar = blessed.box(
  {
    height: 1,
    top: 0,
    fg: "green",
    selectedFg: "green",
    tags: true
});
screen.append(statusbar);

// message display area
const log = contrib.log(
      {
        top: 1,
        bottom: 3,
        fg: "green",
        selectedFg: "green",
        label: 'Printer console',
        border: {type: "line", fg: "cyan"},
        tags: true
    });
screen.append(log);

// command input area
const input = blessed.textbox(
  {
    height: 3,
    bottom: 0,
    fg: "green",
    selectedFg: "green",
    label: 'Command',
    inputOnFocus: true,
    border: {type: "line", fg: "cyan"}
});
screen.append(input);

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

var count = 0;
screen.key(['a'], function(ch, key) {
  count++;
  log.log('une ligne ......... ' + count);
  statusbar.setContent('count={red-fg}{white-bg}'+count+'{/}');
  screen.render();
});

input.focus();
screen.render()
