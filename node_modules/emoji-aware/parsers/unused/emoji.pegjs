Emoji
  = p:PhoneButton
  / e:EmojiCharacter v:VariationSelector? {
    return (e.join ? e.join('') : e) + (v ? v.join ? v.join('') : v : '')
  }

PhoneButton
  = [0-9#*] VariationSelector? '\u20E3' {return text()}

EmojiCharacter
  = [\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]
  / [\uD83C][\uDC04-\uDFFF]
  / [\uD83D][\uDC00-\uDE4F]
  / [\uD83D][\uDE80-\uDEC5]
  / [\u203C-\u3299]
  / '\u24C2'
  / [\u2702-\u27B0]
  / [\u00A9\u00AE]

VariationSelector
  = [\uFE0E\uFE0F]
