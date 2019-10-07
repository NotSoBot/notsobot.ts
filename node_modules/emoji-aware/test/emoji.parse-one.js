'use strict';

import test from 'ava';

var characters = require('./fixtures/emoji-characters.js');
var emoji = require('../parsers/emoji.js');

characters.forEach(function (e) {
  test('parse one emoji ' + e, function (t) {
    t.is(emoji.parse(e)[0], e);
  });
});
