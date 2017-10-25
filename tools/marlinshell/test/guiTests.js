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
    it('inital temperature reporting', function() {
      var gui = new Gui('port', 'recorder', false);
      assert.match(gui['computeStatusLine'](), /Hotend:0\/0°C  Hotbed:0\/0°C/, 'status line');
      gui.destroy();
    });
  });

});
