'use strict';

import test from 'ava';

var characters = require('./fixtures/emoji-characters.js');
var emoji = require('../parsers/emoji.js');

characters.forEach(function (e) {
  test('parse two emoji ' + e + e, function (t) {
    var result = emoji.parse(e + e);

    t.is(result[0], e);
    t.is(result[1], e);
  });
});
