'use strict';

import test from 'ava';

var emoji = require('../emoji-aware.js');

test('parse cjk text', function (t) {
  var s1 = '你好，找･文章６';
  var s2 = '你好找文章';

  var result1 = emoji.split(s1);
  var result2 = emoji.split(s2);

  t.is(result1[0], '你');
  t.is(result2[0], '你');
});

test('punctuation', function (t) {
  var example = 'たまたま見つけたからといって、フォトジェニック。';

  t.is(example, emoji.withoutEmoji(example).join(''));
});
