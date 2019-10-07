'use strict';

var Emoji = require('./emoji.js').Emoji;
var Parsimmon = require('parsimmon');
var flattenDeep = require('lodash.flattendeep');

var SurrogatePair = Parsimmon.regex(/[\uD800-\uDBFF][\uDC00-\uDFFF]/);

var Unicode = exports.Unicode = Parsimmon.alt(
  Emoji,
  Parsimmon.regex(/[\u0000-\uD799]/),
  Parsimmon.regex(/[\uE000-\uFFFF]/),
  SurrogatePair
);

exports.parseOne = function (string) {
  var result = Unicode.parse(string);

  if (!result.status) {
    return false;
  }

  return flattenDeep(result.value).join('');
};

exports.parse = function (string) {
  var result = Unicode.many().parse(string);

  if (!result.status) {
    return false;
  }

  return result.value.map(function (p) {
    return flattenDeep(p).join('');
  });
};
