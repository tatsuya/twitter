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

  describe('#parseField()', function() {
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
});