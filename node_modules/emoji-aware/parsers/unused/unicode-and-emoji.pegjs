@import "./emoji.pegjs" as Emoji

start
  = Symbol*

Symbol
  = Emoji
  / SurrogatePair
  / [\u0000-\uD799]

SurrogatePair
  = [\uD800-\uDBFF][\uDC00-\uDFFF]
