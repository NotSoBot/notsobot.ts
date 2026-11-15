// Every formatter's `createMediascript` lines with sample args, for notsobot.api's `scripts/check_mediascript_lines.py` to
// run through mediascript's own argument parsing. A renamed argument, a removed action or an enum spelled differently
// than mediascript's then fails there instead of in someone's pipe.
//
//   npm run build && node scripts/pipe-mediascript-lines.js > /tmp/pipe-lines.json
//   (or LIB=some/other/build node scripts/... for a build that isn't ./lib)
//
// Two samples a formatter: only its required args (the defaults mediascript fills in), and every arg of its
// `CommandArgs` (each value made from the arg's name and type, or the first choice its prefixed command allows). Sample media and files are `https://samples.test/NAME`,
// the checker swaps them for notsobot.api's assets/command-previews/NAME.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COMMANDS_SOURCE = path.join(ROOT, 'src/utils/formatter/commands');
const PREFIXED_SOURCE = path.join(ROOT, 'src/commands/prefixed');

const LIB = path.resolve(process.env.LIB || path.join(ROOT, 'lib'));
const Constants = require(path.join(LIB, 'constants'));
const Commands = require(path.join(LIB, 'utils/formatter/commands'));
const { MediascriptChain } = require(path.join(LIB, 'utils/formatter/mediascript'));


const SAMPLE = (name) => `https://samples.test/${name}`;
const INPUT = SAMPLE('video.mp4');
// what a formatter reads off the context (youtube's channel is the user's name)
const CONTEXT = {user: {globalName: 'Sample User', username: 'sample'}};

// by the arg's name first, its type after
const STRING_SAMPLES = {
  background: 'red',
  bottom: 'bottom text',
  channel: 'NotSoBot',
  chord: 'C4,E4,G4',
  color: 'red',
  cube: SAMPLE('grade.cube'),
  fillcolor: 'red',
  flyImage: SAMPLE('photo.jpg'),
  font: 'IMPACT',
  notes: 'C4 E4 G4:2',
  resize: 'fit(mw, mh)',
  sentence: 'hello there',
  size: '64',
  text: 'hello there',
  title: 'hello',
  top: 'top text',
  veg: SAMPLE('preview1280.veg'),
  vep: SAMPLE('twirl.vep'),
  wlmp: SAMPLE('movie.wlmp'),
  x: '10',
  xyt: SAMPLE('funface.xyt'),
  y: '10',
};
// args with their own words that no command lists as choices
const SAMPLE_OVERRIDES = {
  'media.iv.manipulation.ripple': {type: 'BLEND'},
  'media.iv.manipulation.timecode.vegas': {type: 'drop', x: 'left', y: 'top'},
  'media.iv.tools.rotate.3d': {order: 'ptr'},
};
// left out, a sample of these turns the step into the job-per-step path (that's checked by it returning null)
const SKIPPED = new Set(['file', 'fontUrl', 'midi', 'url', 'xytId']);


function parseCommandArgs(source) {
  const match = source.match(/export interface CommandArgs(?: extends [^{]+)? \{([\s\S]*?)\n\}/);
  if (!match) {
    return null;
  }
  const fields = [];
  for (let line of match[1].split('\n')) {
    line = line.replace(/\/\/.*$/, '').trim();
    const field = line.match(/^(\w+)(\?)?:\s*(.+?),?$/);
    if (field) {
      fields.push({name: field[1], optional: !!field[2], type: field[3]});
    }
  }
  return fields;
}

// `{name: 'axis', ... type: Parameters.oneOf({choices: MediaBounceAxes})}` in the prefixed commands, by formatter
function findChoices() {
  const choices = {};
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const filepath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(filepath);
        continue;
      }
      const source = fs.readFileSync(filepath, 'utf8');
      const keys = new Set([...source.matchAll(/Formatter\.Commands\.(\w+)/g)].map((x) => x[1]));
      for (const [text, name, enumName] of source.matchAll(/\{[^{}]*?name: '(\w+)'[^}]*?choices: (?:Object\.values\()?(\w+)/g)) {
        if (!(enumName in Constants)) {
          continue;
        }
        // a `label` is the key the parsed args use
        const label = (text.match(/label: '(\w+)'/) || [])[1] || name;
        for (const key of keys) {
          choices[key] = Object.assign(choices[key] || {}, {[label]: Object.values(Constants[enumName])[0]});
        }
      }
    }
  };
  walk(PREFIXED_SOURCE);
  return choices;
}
const CHOICES = findChoices();


function sampleValue({ name, type }, choices = {}) {
  if (name in choices) {
    return choices[name];
  }
  if (name === 'urls') {
    // the piped media's placeholder (`mediaUrls` in a pipe), then a second media
    return ['https://notsobot.com', SAMPLE('photo.jpg')];
  }
  if (type.startsWith('Array<')) {
    return [SAMPLE('video2.mp4')];
  }
  if (name in STRING_SAMPLES) {
    return STRING_SAMPLES[name];
  }
  if (/\bboolean\b/.test(type)) {
    return true;
  }
  if (/\bnumber\b/.test(type)) {
    return 1;
  }
  // an enum from constants, its first value
  const enumName = type.split('|').map((x) => x.trim()).find((x) => x in Constants);
  if (enumName) {
    return Object.values(Constants[enumName])[0];
  }
  if (/\bstring\b/.test(type)) {
    return 'test';
  }
  return undefined;
}

function createLines(formatter, args) {
  const chain = new MediascriptChain(INPUT);
  try {
    const lines = formatter.createMediascript(args, chain, CONTEXT);
    if (lines === null) {
      return {code: null};
    }
    chain.lines.push(...((Array.isArray(lines)) ? lines : [lines]));
    return {code: chain.code};
  } catch(error) {
    return {code: null, error: String(error)};
  }
}


const files = {};
for (const line of fs.readFileSync(path.join(COMMANDS_SOURCE, 'index.ts'), 'utf8').split('\n')) {
  const match = line.match(/^import \* as (\w+) from '\.\/(.+)';$/);
  if (match) {
    files[match[1]] = match[2];
  }
}

const results = [];
for (const key of Object.keys(Commands).sort()) {
  const formatter = Commands[key];
  if (!formatter || !formatter.IS_PIPEABLE) {
    continue;
  }
  const result = {id: formatter.COMMAND_ID, name: key};
  if (typeof(formatter.createMediascript) !== 'function') {
    results.push({...result, sample: 'none', code: null, error: 'no createMediascript'});
    continue;
  }
  const fields = (files[key]) ? parseCommandArgs(fs.readFileSync(path.join(COMMANDS_SOURCE, `${files[key]}.ts`), 'utf8')) : null;
  if (!fields) {
    results.push({...result, sample: 'none', code: null, error: 'CommandArgs not found'});
    continue;
  }
  for (const sample of ['required', 'all']) {
    const args = {};
    for (const field of fields) {
      if (SKIPPED.has(field.name) || (sample === 'required' && field.optional)) {
        continue;
      }
      const value = sampleValue(field, {...CHOICES[key], ...SAMPLE_OVERRIDES[formatter.COMMAND_ID]});
      if (value !== undefined) {
        args[field.name] = value;
      }
    }
    if (fields.some((x) => x.name === 'url')) {
      args.url = INPUT;
    }
    results.push({...result, sample, args, ...createLines(formatter, args)});
  }
}

process.stdout.write(JSON.stringify(results, null, 1));
