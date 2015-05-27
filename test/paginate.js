'use strict';

var assert = require('assert');
var paginate = require('../lib/helper/paginate');

describe('paginate', function() {
  it('should parse for first page \'number of items: 15, items per page: 5, current page: 1\'', function() {
    var page = paginate(1, 5, 15);
    assert.deepEqual(page, {
      number: 0,
      perpage: 5,
      from: 0,
      to: 4,
      total: 15,
      count: 3
    });
  });

  it('should parse for second page \'number of items: 15, items per page: 5, current page: 2\'', function() {
    var page = paginate(2, 5, 15);
    assert.deepEqual(page, {
      number: 1,
      perpage: 5,
      from: 5,
      to: 9,
      total: 15,
      count: 3
    });
  });

  it('should defaults current page to 1 \'number of items: 15, items per page: 5, current page: 0\'', function() {
    var page = paginate(0, 5, 15);
    assert.deepEqual(page, {
      number: 0,
      perpage: 5,
      from: 0,
      to: 4,
      total: 15,
      count: 3
    });
  });

  it('should parse if items are empty \'number of items: 0, items per page: 5, current page: 1\'', function() {
    var page = paginate(0, 5, 0);
    assert.deepEqual(page, {
      number: 0,
      perpage: 5,
      from: 0,
      to: 4,
      total: 0,
      count: 0
    });
  });
});