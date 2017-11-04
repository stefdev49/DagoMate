var assert = require('chai').assert;
var Gui = require('../src/gui.js');

describe('Gui module checks', function() {

  describe('Constructor', function() {
    it('object should be defined', function() {
      assert.exists(Gui, 'Gui object');
    });
    it('object constructor should work', function() {
      var gui = new Gui('port', 'recorder', true);
      assert.exists(gui, 'Gui instance');
      assert.isTrue(gui.isConnected(), 'Connected');
      gui.destroy();
    });
  });

  describe('Status line checks', function() {
    it('should be connected', function() {
      var gui = new Gui('port', 'recorder', true);
      assert.isTrue(gui.isConnected(), 'connected is true');
      assert.match(gui.computeStatusLine(), /{green-bg}connected/, 'status line');
      gui.destroy();
    });
    it('shouldn\'t be connected', function() {
      var gui = new Gui('port', 'recorder', false);
      assert.isFalse(gui.isConnected(), 'connected is false');
      assert.match(gui['computeStatusLine'](), /{red-bg}disconnected/, 'status line');
      gui.destroy();
    });
    it('should be busy when created', function() {
      var gui = new Gui('port', 'recorder', false);
      assert.isTrue(gui.isBusy(), 'busy is true');
      assert.match(gui['computeStatusLine'](), /{yellow-bg}busy {/, 'status line');
      gui.destroy();
    });
    it('shouldn\'t be busy', function() {
      var gui = new Gui('port', 'recorder', false);
      gui.setBusy(false);
      assert.isFalse(gui.isBusy(), 'busy is false');
      assert.match(gui['computeStatusLine'](), /{green-bg}ready{/, 'status line');
      gui.destroy();
    });
    it('initial temperature reporting', function() {
      var gui = new Gui('port', 'recorder', false);
      assert.match(gui['computeStatusLine'](), /Hotend:0\/0°C  Hotbed:0\/0°C/, 'status line');
      gui.destroy();
    });
  });

  describe('Console logging checks', function() {
    function MockLogger () {
      this.value = '';
      this.last = '';
      this.log = function (message) {
        this.value += message;
        this.last = message;
      }
      this.getValue = function () {
        return this.value;
      }
      this.getLast = function () {
        return this.last;
      }
    }

    it('should log test message', function() {
      var logger = new MockLogger();
      var gui = new Gui('port', 'recorder', true);
      gui.setLogConsole(logger);
      gui.consoleOutput('test message\n');
      assert.match(logger.getValue(), /^test message$/, 'test message');
      assert.match(gui.computeStatusLine(), /Hotend:0\/0°C  Hotbed:0\/0°C/, 'status line');
      gui.destroy();
    });

    it('should update temperature report', function() {
      var logger = new MockLogger();
      var gui = new Gui('port', 'recorder', true);
      gui.setLogConsole(logger);
      gui.consoleOutput(' T:142.42 /200.00 B:20.94 /60.00 @:127 B@:0 W:?\n');
      assert.match(gui.computeStatusLine(), /Hotend:142.42\/200.00°C  Hotbed:20.94\/60.00°C/, 'status line');
      gui.destroy();
    });

    it('should become ready when SD init fails', function() {
      var logger = new MockLogger();
      var gui = new Gui('port', 'recorder', true);
      gui.setLogConsole(logger);
      gui.consoleOutput('echo:SD init fail\n');
      assert.match(gui['computeStatusLine'](), /{green-bg}ready{/, 'status line');
      gui.destroy();
    });

    it('should merge multi-line messages until EOL', function() {
      var logger = new MockLogger();
      var gui = new Gui('port', 'recorder', true);
      gui.setLogConsole(logger);
      gui.consoleOutput('first part, ');
      gui.consoleOutput('second part, ');
      gui.consoleOutput('last part\n');
      assert.match(logger.getValue(), /^first part, second part, last part$/, 'test message');
      gui.destroy();
    });

    it('should detect not homed yet error', function() {
      var logger = new MockLogger();
      var gui = new Gui('port', 'recorder', true);
      assert.isTrue(gui.isError("Home XYZ first"));
      gui.destroy();
    });

  });
});
