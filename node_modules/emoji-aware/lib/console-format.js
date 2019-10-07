'use strict';

var isEmoji = require('./is-emoji.js');
var split = require('../parsers/unicode-and-emoji.js').parse;

module.exports = function consoleFormat(string) {
  var array = split(string);
  var result = '';

  array.forEach(function (symbol) {
    result += isEmoji(symbol) ? symbol + ' ' : symbol;
  });

  return result;
};
