'use strict';

module.exports = function(page, perpage, total) {
  page = Math.max(
    parseInt(page || '1', 10),
    1
  ) - 1;

  perpage = perpage || 10;

  return {
    number: page,
    perpage: perpage,
    from: page * perpage,
    to: page * perpage + perpage - 1,
    total: total,
    count: Math.ceil(total / perpage)
  };
};