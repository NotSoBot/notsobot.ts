// builds the mediascript `pipe` runs as one job: every step's formatter turns its parsed args into action lines
// (`createMediascript`), all working on the one loaded media so it never comes back to the bot between steps


export type MediascriptValue = boolean | number | string | null | undefined;

// what a formatter's `createMediascript` gets, `key` is the media its lines change
export class MediascriptChain {
  key: string;
  lines: Array<string> = [];

  private loaded = 0;

  constructor(url: string) {
    this.key = this.load(url);
  }

  get code(): string {
    return this.lines.join('\n');
  }

  // another media for a step that takes two (`overlay`, `join`, ...), its key to use in the step's lines
  load(url: string): string {
    const key = `media${++this.loaded}`;
    this.lines.push(line('load', encodeValue(url), key));
    return key;
  }

  // a file that isn't media (`loadcube`, `loadveg`, `loadxyt`, ...), its key for the step's render line
  loadFile(action: string, url: string): string {
    const key = `${action.replace(/^load/, '')}${++this.loaded}`;
    this.lines.push(line(action, encodeValue(url), key));
    return key;
  }
}


// strings are json, so spaces, quotes, `NAME=`, `$(...)` and `#` stay text. `​` splits lines like a newline does
export function encodeValue(value: boolean | number | string): string {
  if (typeof(value) === 'string') {
    return JSON.stringify(value).replace(/​/g, '\\u200b');
  }
  if (typeof(value) === 'number' && !Number.isFinite(value)) {
    throw new Error(`Can't put ${value} in a mediascript line`);
  }
  return String(value);
}


// `action positional... NAME=value...`, undefined/null named values are left for the action's default
export function line(
  action: string,
  ...values: Array<string | Record<string, MediascriptValue>>
): string {
  const parts: Array<string> = [action];
  for (let value of values) {
    if (typeof(value) === 'string') {
      parts.push(value);
      continue;
    }
    for (let name in value) {
      const x = value[name];
      if (x !== undefined && x !== null) {
        parts.push(`${name}=${encodeValue(x)}`);
      }
    }
  }
  return parts.join(' ');
}


// args a step's mediascript has no way to take, the pipe then runs every step as its own job like before
export function hasAny(args: Record<string, any>, ...names: Array<string>): boolean {
  return names.some((name) => args[name] !== undefined && args[name] !== null && args[name] !== '');
}
