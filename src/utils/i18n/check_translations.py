# Checks translation files against en.ts: `python3 src/utils/i18n/check_translations.py ja` (or no args for every language)
# - every line is `  'key': 'value',` (single quotes, escaped with \), a comment, or blank
# - every english key is present, in the same order, with no extra keys
# - {placeholders} match the english string
# - slash command names (`commands.*.name`) are valid discord names and unique among their siblings (context menu names just need to be 32 characters or less)
# - slash command descriptions (`commands.*.description`) and choice names are 100 characters or less
import os
import re
import sys

DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'languages')
LINE = re.compile(r"^  '([^']+)': '((?:\\.|[^'\\])*)',$")
OTHER = re.compile(r"^(\s*|\s*//.*|import .*|export const \w+: Translations = Object\.freeze\(\{|\}\);)$")
PLACEHOLDER = re.compile(r'\{\w+\}')
# discord's `^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$`, python's \w is letters/numbers/_ (plus thai/devanagari marks via the ranges)
NAME = re.compile(r'^[-\wऀ-ॿ฀-๿]{1,32}$')


def load(code):
  entries, errors = {}, []
  with open(os.path.join(DIRECTORY, f'{code}.ts'), encoding='utf-8') as file:
    for number, line in enumerate(file.read().split('\n'), 1):
      match = LINE.match(line)
      if match:
        key, value = match.groups()
        if key in entries:
          errors.append(f'line {number}: duplicate key {key}')
        entries[key] = re.sub(r'\\(.)', r'\1', value)
      elif not OTHER.match(line):
        errors.append(f'line {number}: unparseable: {line[:80]}')
  return entries, errors


def placeholders(text):
  return sorted(PLACEHOLDER.findall(text))


english, _ = load('en')
codes = sys.argv[1:] or sorted(x[:-3] for x in os.listdir(DIRECTORY) if x.endswith('.ts') and x != 'en.ts')

failed = False
for code in codes:
  translations, errors = load(code)
  missing = [key for key in english if key not in translations]
  siblings = {}
  for key, text in translations.items():
    if key not in english:
      errors.append(f'unknown key: {key}')
      continue
    if not text:
      errors.append(f'empty: {key}')
      continue
    if placeholders(text) != placeholders(english[key]):
      errors.append(f'placeholders differ: {key} ({placeholders(english[key])} vs {placeholders(text)})')
    if key.startswith('commands.context.') and key.endswith('.name'):
      # context menu commands can have spaces and capitals
      if len(text) > 32:
        errors.append(f'over 32 characters: {key} ({len(text)})')
    elif key.startswith('commands.') and key.endswith('.name'):
      if not NAME.match(text) or text != text.lower():
        errors.append(f'invalid slash command name: {key} = {text!r}')
      parent = '.'.join(key.split('.')[:-2])
      siblings.setdefault(parent, []).append((key, text))
    if (key.startswith('commands.') and key.endswith('.description')) or key.startswith('choices.'):
      if len(text) > 100:
        errors.append(f'over 100 characters: {key} ({len(text)})')
  for parent, children in siblings.items():
    seen = {}
    for key, text in children:
      if text in seen:
        errors.append(f'duplicate slash command name {text!r}: {seen[text]} and {key}')
      seen[text] = key
  if not missing and [key for key in translations if key in english] != list(english):
    errors.append('keys are not in the same order as en.ts')
  print(f'{code}: {len(english) - len(missing)}/{len(english)} keys, {len(missing)} missing, {len(errors)} errors')
  for error in errors[:50]:
    print(f'  {error}')
  failed = failed or bool(missing) or bool(errors)

sys.exit(1 if failed else 0)
