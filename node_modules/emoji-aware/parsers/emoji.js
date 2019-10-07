'use strict';

var Parsimmon = require('parsimmon');
var flattenDeep = require('lodash.flattendeep');

var OptionalVariationSelector =
  exports.OptionalVariationSelector = Parsimmon.regex(/[\ufe0e\ufe0f]{0,1}/)
    .desc('an optional variation selector (\\ufe0e or \\ufe0f)');

var RequiredVariationSelector =
  exports.RequiredVariationSelector = Parsimmon.regex(/[\ufe0e\ufe0f]/)
    .desc('an required variation selector (\\ufe0e or \\ufe0f)');

var KeycapEmoji = Parsimmon.seq(
  Parsimmon.regex(/[0-9#*]/),
  OptionalVariationSelector,
  Parsimmon.string('\u20e3')
).desc('a keycap emoji');

var FlagEmoji = Parsimmon.regex(/\ud83c[\udde6-\uddff]/)
  .times(2)
  .desc('a flag emoji');

var GreatBritainEmoji = Parsimmon.seq(
  Parsimmon.string(
    '\ud83c\udff4' + // black waving flag
    '\udb40\udc67' + // tag G
    '\udb40\udc62' // tag B
  ),
  Parsimmon.alt(
    Parsimmon.string(
      '\udb40\udc77' + // tag W
      '\udb40\udc6c' + // tag L
      '\udb40\udc73' // tag S
    ),
    Parsimmon.string(
      '\udb40\udc73' + // tag S
      '\udb40\udc63' + // tag C
      '\udb40\udc74' // tag T
    ),
    Parsimmon.string(
      '\udb40\udc65' + // tag E
      '\udb40\udc6e' + // tag N
      '\udb40\udc67' //tag G
    )
  ),
  Parsimmon.string('\udb40\udc7f') // cancel tag
);

var ZeroWidthJoiner = Parsimmon.string('\u200d')
  .desc('zero-width joiner (\\u200d)');

var OptionalFitzpatrickModifier =
  Parsimmon.regex(/(\ud83c[\udffb-\udfff]){0,1}/)
    .desc('an optional Fitzpatrick modifier');

var SimpleEmoji = Parsimmon.alt(
  // Simple Unicode emoji
  Parsimmon.regex(/[\u203c-\u2bff]/),
  Parsimmon.regex(/[\u2702-\u27b0]/),
  // Enclosed CJK Letters and Months
  Parsimmon.regex(/[\u3200-\u32ff]/),
  // Emoji flags
  FlagEmoji,
  GreatBritainEmoji,
  // Surrogate pairs
  Parsimmon.regex(/\ud83c[\udc04-\udfff]/),
  Parsimmon.regex(/\ud83d[\udc00-\udfff]/),
  Parsimmon.regex(/\ud83e[\udc00-\udfff]/)
);

var VariationSelectorEmoji = Parsimmon.seq(
  // Single characters that become emoji only with a variation selector
  Parsimmon.alt(
    Parsimmon.string('\u00a9'), // trademark
    Parsimmon.string('\u00ae'), // copyright
    Parsimmon.string('\u3030'), // 〰
    Parsimmon.string('\u303d') // 〽
  ),
  RequiredVariationSelector
);

var ZeroWidthJoinerEmoji = Parsimmon.seq(
  SimpleEmoji,
  OptionalVariationSelector,
  Parsimmon.seq(
    ZeroWidthJoiner,
    SimpleEmoji,
    OptionalVariationSelector
  ).times(1, 3)
);

var Emoji = exports.Emoji = Parsimmon.seq(
  Parsimmon.alt(
    VariationSelectorEmoji,
    ZeroWidthJoinerEmoji,
    Parsimmon.seq(
      SimpleEmoji,
      OptionalFitzpatrickModifier,
      OptionalVariationSelector
    ),
    KeycapEmoji
  ),
  OptionalFitzpatrickModifier
).map(function (result) {
  return flattenDeep(result).join('');
});

exports.parseOne = function (string) {
  var result = Emoji.parse(string);

  if (!result.status) {
    return false;
  }

  return result.value;
};

exports.parse = function (string) {
  var result = Emoji.many().parse(string);

  if (!result.status) {
    return false;
  }

  return result.value;
};
