'use strict';

import test from 'ava';

var characters = require('./fixtures/emoji-characters.js');
var emoji = require('../parsers/emoji.js');

characters.forEach(function (e) {
  test('parseOne emoji ' + e, function (t) {
    t.is(emoji.parseOne(e), e);
  });
});

test('parseOne fail non-emoji', function (t) {
  t.false(emoji.parseOne('a'));
});
