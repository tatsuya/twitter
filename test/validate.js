'use strict';

var assert = require('assert');

var validate = require('../lib/middleware/validate');

describe('validate', function() {
  describe('#parseField()', function() {
    it('should split entry[title] into \'entry\' and \'title\'', function() {
      var field = validate.parseField('entry[title]');
      assert.equal(field[0], 'entry');
      assert.equal(field[1], 'title');
    });
  });

  describe('#getField()', function() {
    it('should return value of propery based on parseField() results', function() {
      var mockRequest = {
        body: {
          entry: {
            title: 'Title'
          }
        }
      };
      var field = ['entry', 'title'];
      var value = validate.getField(mockRequest, field);
      assert.equal(value, 'Title');
    });

    it('should return undefined if value of propery based on parseField() results not found', function() {
      var mockRequest = {
        body: {
          entry: {}
        }
      };
      var field = ['entry', 'title'];
      var value = validate.getField(mockRequest, field);
      assert.equal(value, undefined);
    });
  });

  describe('#username()', function() {
    function getMockRequest(username, flash) {
      return {
        body: {
          user: {
            name: username
          }
        },
        flash: flash
      };
    }

    function getMockResponse(redirect) {
      return {
        redirect: redirect
      };
    }

    it('should accept valid username', function(done) {
      var middleware = validate.username('user[name]');
      var req = getMockRequest('asdf1234', function flash() {});
      var res = getMockResponse(function redirect() {
        assert(false, 'The request should not be redirected');
        done();
      });
      middleware(req, res, function() {
        done();
      });
    });

    it('should redirect the request back to the referer', function(done) {
      var middleware = validate.username('user[name]');
      var req = getMockRequest('invalid-username!@#$%', function flash(type, message) {
        assert.equal(type, 'error');
        assert.equal(message, 'user name can only contain alphanumeric characters (letters A-Z, numbers 0-9) or underscores');
      });
      var res = getMockResponse(function redirect(path) {
        assert.equal(path, 'back');
        done();
      });
      middleware(req, res, function() {
        assert(false, 'The request is not redirected');
        done();
      });
    });
  });

  describe('#password()', function() {
    function getMockRequest(password, flash) {
      return {
        body: {
          user: {
            pass: password
          }
        },
        flash: flash
      };
    }

    function getMockResponse(redirect) {
      return {
        redirect: redirect
      };
    }

    it('should accept valid username', function(done) {
      var middleware = validate.username('user[pass]');
      var req = getMockRequest('asdf1234', function flash() {});
      var res = getMockResponse(function redirect() {
        assert(false, 'The request should not be redirected');
        done();
      });
      middleware(req, res, function() {
        done();
      });
    });

    it('should redirect the request back to the referer', function(done) {
      var middleware = validate.password('user[pass]');
      var req = getMockRequest('☃☃☃', function flash(type, message) {
        assert.equal(type, 'error');
        assert.equal(message, 'user pass can only contain ASCII chracters');
      });
      var res = getMockResponse(function redirect(path) {
        assert.equal(path, 'back');
        done();
      });
      middleware(req, res, function() {
        assert(false, 'The request is not redirected');
        done();
      });
    });
  });
});