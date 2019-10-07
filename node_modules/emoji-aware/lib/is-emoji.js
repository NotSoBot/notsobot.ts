'use strict';

var Emoji = require('../parsers/emoji.js').Emoji;

module.exports = function (string) {
  return Emoji.parse(string).status;
};
