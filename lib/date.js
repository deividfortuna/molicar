'use strict';

const addDays = function(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

module.exports = { addDays };
