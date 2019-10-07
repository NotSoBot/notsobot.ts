'use strict';

var emoji = require('emojilib');

module.exports = new Set(Object.keys(emoji.lib)
  .filter(function (key) {
    return emoji.lib[key].char;
  })
  .reduce(function (collected, key) {
    var e = emoji.lib[key];
    var char = e.char;

    if (e.fitzpatrick_scale) {
      emoji.fitzpatrick_scale_modifiers.forEach(function (modifier) {
        collected.push(char + modifier);
      });
    }

    collected.push(char);

    return collected;
  }, [])
  .concat([
    '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    '🦓', // Zebra
    '👪',
    '💏',
    '💑',
    '👍🏻',
    '👍🏼',
    '👍🏽',
    '👍🏾',
    '👍🏿',
    '🤶🏿',
    '🤰🏿',
    '🤵🏿',
    '🤴🏿',
    '👁‍🗨',
    '👨‍👨‍👦',
    '👨‍👨‍👧',
    '👨‍👩‍👦',
    '👨‍👩‍👧',
    '👩‍👩‍👦',
    '👩‍👩‍👧',
    '👨‍❤️‍👨',
    '👩‍❤️‍👨',
    '👩‍❤️‍👩',
    '👨‍👨‍👦‍👦',
    '👨‍👨‍👧‍👦',
    '👨‍👨‍👧‍👧',
    '👨‍👩‍👦‍👦',
    '👨‍👩‍👧‍👦',
    '👨‍👩‍👧‍👧',
    '👩‍👩‍👦‍👦',
    '👩‍👩‍👧‍👦',
    '👩‍👩‍👧‍👧',
    '👨‍❤️‍💋‍👨',
    '👩‍❤️‍💋‍👨',
    '👩‍❤️‍💋‍👩'
  ]));
