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
        label: 'Printer message',
        border: {type: "line", fg: "cyan"}
    });
screen.append(log);

// command input area
const inputbox = blessed.textbox(
  {
    height: 3,
    bottom: 0,
    fg: "green",
    selectedFg: "green",
    label: 'Command',
    border: {type: "line", fg: "cyan"}
});
screen.append(inputbox);

screen.key(['C-d', 'C-c'], function(ch, key) {
  return process.exit(0);
});

var count = 0;
screen.key(['a'], function(ch, key) {
  count++;
  log.log('une ligne ......... ' + count);
  statusbar.setContent('count={red-fg}{green-bg}'+count+'{/}');
  screen.render();
});

screen.render()
