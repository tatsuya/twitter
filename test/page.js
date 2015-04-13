'use strict';

var assert = require('assert');

var page = require('../lib/middleware/page');

describe('page', function() {

  function getMiddleware(totalNumberOfItems, itemsPerPage) {
    return page(function(fn) {
      fn(null, totalNumberOfItems);
    }, itemsPerPage);
  }

  function getMockRequest(currentPage) {
    return {
      params: {
        page: 1
      }
    };
  }

  function getMockResponse() {
    return {
      locals: {}
    };
  }

  it('should parse \'number of items: 15, items per page: 5, current page: 1\'', function(done) {
    var middleware = getMiddleware(15, 5);
    var req = getMockRequest(1);
    var res = getMockResponse();

    middleware(req, res, function() {
      assert.deepEqual(res.locals.page, {
        number: 0,
        perpage: 5,
        from: 0,
        to: 4,
        total: 15,
        count: 3
      });
      done();
    });
  });

  it('should defaults current page to 1 \'number of items: 15, items per page: 5, current page: 0\'', function(done) {
    var middleware = getMiddleware(15, 5);
    var req = getMockRequest(0);
    var res = getMockResponse();

    middleware(req, res, function() {
      assert.deepEqual(res.locals.page, {
        number: 0,
        perpage: 5,
        from: 0,
        to: 4,
        total: 15,
        count: 3
      });
      done();
    });
  });

  it('should parse if items are empty \'number of items: 0, items per page: undefined, current page: 1\'', function(done) {
    var middleware = getMiddleware(0);
    var req = getMockRequest(1);
    var res = getMockResponse();

    middleware(req, res, function() {
      assert.deepEqual(res.locals.page, {
        number: 0,
        perpage: 10,
        from: 0,
        to: 9,
        total: 0,
        count: 0
      });
      done();
    });
  });
});