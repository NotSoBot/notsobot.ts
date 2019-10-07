@include "emoji.ne"

Unicode
 -> Symbol:* {% id %}

Symbol
 -> SurrogatePair {% id %}
  | [\u0000-\uD799] {% id %}
  | Emoji {% id %}

SurrogatePair
 -> [\uD800-\uDBFF] [\uDC00-\uDFFF]
