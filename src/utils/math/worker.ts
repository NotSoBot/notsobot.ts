import { runInNewContext } from 'vm';
import { parentPort } from 'worker_threads';

import * as mathjs from 'mathjs';



export const MathJS = mathjs.create(mathjs.all, {
  number: 'BigNumber',  
});

// `base(1295, 36)` -> `zz`, `frombase("zz", 36)` -> `1295`. digits are 0-9 then a-z, so bases 2 to 36
const BASE_DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
// keeps the output (and the BigInt work) small, the BigNumber precision is 64 digits anyways
const BASE_MAX_LENGTH = 1024;

function toBaseRadix(radix: any): bigint {
  const value = MathJS.bignumber(radix);
  if (!value.isInteger() || value.lt(2) || value.gt(BASE_DIGITS.length)) {
    throw new Error('Base must be an integer from 2 to 36');
  }
  return BigInt(value.toFixed());
}

function toBaseInteger(value: any): bigint {
  const bigNumber = MathJS.bignumber(value);
  if (!bigNumber.isFinite() || !bigNumber.isInteger()) {
    throw new Error('Only integers can be converted to another base');
  }
  const decimal = bigNumber.toFixed();
  if (BASE_MAX_LENGTH < decimal.length) {
    throw new Error('Number is too large to convert');
  }
  return BigInt(decimal);
}

MathJS.import({
  base: (value: any, radix: any): string => {
    const base = toBaseRadix(radix);
    let integer = toBaseInteger(value);
    const isNegative = integer < 0n;
    if (isNegative) {
      integer = -integer;
    }
    let digits = '';
    do {
      digits = BASE_DIGITS[Number(integer % base)] + digits;
      integer /= base;
    } while (integer);
    return (isNegative) ? `-${digits}` : digits;
  },
  // also takes plain numbers so `frombase(1010, 2)` works without quotes
  frombase: (value: any, radix: any): mathjs.BigNumber => {
    const base = toBaseRadix(radix);
    let text = (isString(value)) ? value.trim().toLowerCase() : toBaseInteger(value).toString();
    const isNegative = text.startsWith('-');
    if (isNegative || text.startsWith('+')) {
      text = text.slice(1);
    }
    if (!text.length || BASE_MAX_LENGTH < text.length) {
      throw new Error(`Invalid base ${base} number`);
    }
    let integer = 0n;
    for (let character of text) {
      const digit = BASE_DIGITS.indexOf(character);
      if (digit === -1 || base <= digit) {
        throw new Error(`Invalid digit "${character}" for base ${base}`);
      }
      integer = integer * base + BigInt(digit);
    }
    return MathJS.bignumber(((isNegative) ? -integer : integer).toString());
  },
});


// grabbed before the functions below are disabled, so the parser itself still works
const createParser = MathJS.parser;

// these can change the shared MathJS instance (or run arbitrary expressions) for every later evaluation, only
// `import` used to be disabled. same list as mathjs' own security guide
const disabled = (name: string) => function () {throw new Error(`Function ${name} is disabled`)};
MathJS.import({
  import: disabled('import'),
  createUnit: disabled('createUnit'),
  evaluate: disabled('evaluate'),
  parse: disabled('parse'),
  simplify: disabled('simplify'),
  derivative: disabled('derivative'),
  resolve: disabled('resolve'),
  reviver: disabled('reviver'),
}, {override: true});

export const ERROR_TIMEOUT_MESSAGE = 'Script execution timed out after';
export const MAX_TIME_MATH = 750;


export function executeEquation(equation: string, parser: mathjs.Parser | null = null): string {
  equation = equation.replace(/\*\*/g, '^');
  equation = removeThousandsSeparators(equation);
  parser = parser || createParser();
  const result = parser.evaluate(equation);
  return formatNumber(result);
}


// `1,000,000 + 5` -> `1000000 + 5`, but not inside of function calls or matrices where the commas separate
// arguments/values (`max(1,234)` used to become `max(1234)`), plain grouping parentheses still work: `2 * (1,000)`
export function removeThousandsSeparators(equation: string): string {
  let result = '';
  let segment = '';
  // true for each open bracket that holds a list (function call, matrix, object), with how many of them are open
  // (checking the whole stack and copying everything before each bracket made this quadratic in the bracket count)
  const stack: Array<boolean> = [];
  let listDepth = 0;
  // the last character that isn't whitespace, decides if a `(` is a function call
  let lastCharacter = '';
  const flush = () => {
    result += (listDepth) ? segment : segment.replace(/\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?)\b/g, (match) => match.replace(/,/g, ''));
    segment = '';
  };
  for (let character of equation) {
    if (character === '(' || character === '[' || character === '{') {
      const isList = character !== '(' || /[A-Za-z0-9_]/.test(lastCharacter);
      flush();
      stack.push(isList);
      if (isList) {
        listDepth++;
      }
      result += character;
    } else if ((character === ')' || character === ']' || character === '}') && stack.length) {
      flush();
      if (stack.pop()) {
        listDepth--;
      }
      result += character;
    } else {
      segment += character;
    }
    if (!/\s/.test(character)) {
      lastCharacter = character;
    }
  }
  flush();
  return result;
}


function isComplex(value: any): value is mathjs.Complex {
  return mathjs.typeOf(value) === 'Complex';
}


function isString(value: any): value is string {
  return mathjs.typeOf(value) === 'string';
}


function isUnits(value: any): value is mathjs.Unit {
  return value && typeof value === 'object' && 'units' in value;
}


function formatNumber(value: any, places: number = 2, maxPrecision: number = 20): string {
  if (isString(value)) {
    return value.toString();
  }

  // matrices/arrays (and multiple expressions) used to hit `isNaN`, which is true for them, so `[1,2]` gave `NaN`
  if (MathJS.isMatrix(value)) {
    value = (value as mathjs.Matrix).toArray();
  }
  if (MathJS.isResultSet(value)) {
    const entries = (value as any).entries as Array<any>;
    return entries.map((entry) => formatNumber(entry, places, maxPrecision)).join('\n');
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => formatNumber(entry, places, maxPrecision)).join(', ')}]`;
  }
  if (typeof(value) === 'boolean' || value === null || value === undefined || typeof(value) === 'function') {
    return String(value);
  }

  if (MathJS.isNaN(value as any)) {
    return 'NaN';
  }

  if (value === Infinity || value === -Infinity) {
    return value.toString();
  }

  if (isComplex(value)) {
    const re = formatNumber(value.re, places, maxPrecision);
    const im = formatNumber(value.im, places, maxPrecision);
    return `${re} + ${im}i`;
  }

  if (isUnits(value)) {
    const units = value.formatUnits();
    return formatNumber(value.toNumber(units), places, maxPrecision);// + ' ' + units;
  }

  const bigNumber = MathJS.isBigNumber(value) ? value : MathJS.bignumber(value);
  const longString = cleanTrailingZeros(bigNumber.toFixed(maxPrecision));
  if (isRepeatingDecimal(longString)) {
    return cleanTrailingZeros(MathJS.round(bigNumber, places).toFixed(places));
  }
  return cleanTrailingZeros(bigNumber.toString());
}


function cleanTrailingZeros(value: string): string {
  if (!value.includes('.')) {
    return value;
  }
  value = value.replace(/0+$/, '');
  return (value.endsWith('.')) ? value.slice(0, -1) : value;
}


// a repeating decimal fills every digit of precision (`1/3` -> 0.33333333333333333333, the last one can be rounded up
// like `2/3` -> ...667). this used to only check that the digits matched, so `0.5555` became `0.56`
function isRepeatingDecimal(value: string, maxDigits: number = 20): boolean {
  const decimal = value.split('.')[1];
  if (decimal && maxDigits <= decimal.length) {
    const firstDigit = decimal[0];
    return decimal.slice(0, -1).split('').every((x) => x === firstDigit);
  }
  return false;
}


export type WorkerMessage = {
  type: 'evaluate',
  equation: string,
  id: number,
  session: number,
} | {
  type: 'dispose',
  session: number,
};

export type WorkerResponse = {
  type: 'ready',
} | {
  type: 'result',
  error?: string,
  id: number,
  result?: string,
  success: boolean,
};


// a parser nobody used for this long is dropped (its tag finished without disposing it), tags run 2 minutes at most
export const SESSION_IDLE_TIME = 5 * 60 * 1000;
// only so a flood of sessions can't keep growing the map, the least recently used ones go first
export const MAX_SESSIONS = 1000;


if (parentPort) {
  // the workers are shared by every tag run in the process, each run (session) gets its own parser so variables only
  // carry over between {math} calls in that run
  const sessions = new Map<number, {lastUsed: number, parser: mathjs.Parser}>();
  const getParser = (session: number): mathjs.Parser => {
    let item = sessions.get(session);
    if (item) {
      // keep the map in least recently used order
      sessions.delete(session);
    } else {
      item = {lastUsed: 0, parser: createParser()};
      while (MAX_SESSIONS <= sessions.size) {
        sessions.delete(sessions.keys().next().value!);
      }
    }
    item.lastUsed = Date.now();
    sessions.set(session, item);
    return item.parser;
  };
  setInterval(() => {
    const now = Date.now();
    for (let [session, item] of sessions) {
      if (now - item.lastUsed < SESSION_IDLE_TIME) {
        break;
      }
      sessions.delete(session);
    }
  }, 60 * 1000).unref();

  let currentId: null | number = null;
  parentPort.on('message', (data: WorkerMessage) => {
    if (data.type === 'dispose') {
      sessions.delete(data.session);
      return;
    }
    currentId = data.id;
    try {
      const result = executeEquation(data.equation, getParser(data.session));
      parentPort!.postMessage({type: 'result', id: data.id, result, success: true} as WorkerResponse);
    } catch (error) {
      parentPort!.postMessage({
        type: 'result',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        id: data.id,
        success: false,
      } as WorkerResponse);
    } finally {
      currentId = null;
    }
  });

  // anything thrown outside an evaluation still answers the one running, so it doesn't wait for its timeout
  const onUnhandled = (error: any) => {
    if (currentId !== null) {
      parentPort!.postMessage({
        type: 'result',
        error: (error && error.message) || 'Uncaught exception occurred',
        id: currentId,
        success: false,
      } as WorkerResponse);
      currentId = null;
    }
  };
  process.on('uncaughtException', onUnhandled);
  process.on('unhandledRejection', onUnhandled);

  // mathjs is loaded by now, the pool only starts timing equations after this
  parentPort.postMessage({type: 'ready'} as WorkerResponse);
}
