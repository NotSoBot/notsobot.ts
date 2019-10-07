'use strict';

import test from 'ava';

var characters = require('./fixtures/emoji-characters.js');
var unicode = require('../parsers/unicode-and-emoji.js');

test('parseOne emoji', t => {
  characters.forEach(function (e) {
    var result = unicode.parseOne(e);

    t.is(result, e);
  });
});

test('parse string that includes emoji', t => {
  characters.forEach(function (e) {
    var result = unicode.parse(`abcd${e}fg`);

    t.is(result[0], 'a');
    t.is(result[1], 'b');
    t.is(result[2], 'c');
    t.is(result[3], 'd');
    t.is(result[4], e);
    t.is(result[5], 'f');
    t.is(result[6], 'g');
  });
});

test('parse unicode string', t => {
  var result = unicode.parse('Testing «ταБЬℓσ»: 1<2 & 4+1>3, now 20% off!');

  t.is(result[0], 'T');
});

test('parseOne fail empty string', t => {
  var result = unicode.parseOne('');

  t.false(result);
});

test('parse empty string', t => {
  var result = unicode.parse('');

  t.deepEqual(result, []);
});

test('parse fail broken string', t => {
  var result = unicode.parse('\uDC00\uDC01');

  t.false(result);
});
