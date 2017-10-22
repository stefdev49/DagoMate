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
      assert.isTrue(gui.getConnected(), 'Connected');
    });
  });

  describe('Status line checks', function() {
    it('should be connected', function() {
      var gui = new Gui('port', 'recorder', true);
      assert.isTrue(gui.getConnected(), 'connected is true');
      assert.match(gui.computeStatusLine(), /{green-bg}connected/, 'status line');
    });
    it('shouldn\'t be connected', function() {
      var gui = new Gui('port', 'recorder', false);
      assert.isFalse(gui.getConnected(), 'connected is false');
      assert.match(gui['computeStatusLine'](), /{red-bg}disconnected/, 'status line');
    });
  });

});
