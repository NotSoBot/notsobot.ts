'use strict';

import test from 'ava';

var characters = require('./fixtures/emoji-characters.js');
var emoji = require('../parsers/emoji.js');

characters.forEach(function (e) {
  test('parse fail on emoji with non-emoji a' + e + 'a', function (t) {
    var result = emoji.parse(`a${e}a`);

    t.false(result);
  });
});
