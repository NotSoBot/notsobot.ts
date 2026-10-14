import { runInNewContext } from 'vm';
import { parentPort } from 'worker_threads';

import * as mathjs from 'mathjs';



export const MathJS = mathjs.create(mathjs.all, {
  number: 'BigNumber',  
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
  // true for each open bracket that holds a list (function call, matrix, object)
  const stack: Array<boolean> = [];
  const isInList = () => stack.some((x) => x);
  const flush = () => {
    result += (isInList()) ? segment : segment.replace(/\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?)\b/g, (match) => match.replace(/,/g, ''));
    segment = '';
  };
  for (let character of equation) {
    if (character === '(' || character === '[' || character === '{') {
      const before = (result + segment).trimEnd();
      const isList = character !== '(' || /[A-Za-z0-9_]$/.test(before);
      flush();
      stack.push(isList);
      result += character;
    } else if ((character === ')' || character === ']' || character === '}') && stack.length) {
      flush();
      stack.pop();
      result += character;
    } else {
      segment += character;
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


export interface WorkerMessage {
  equation: string,
}

export interface WorkerResponse {
  success: boolean,
  result?: string,
  error?: string,
}


if (parentPort) {
  // each MathWorker (one per tag run) has its own thread, so variables only carry over between {math} calls in one run
  const parser = createParser();
  parentPort.on('message', (data: WorkerMessage) => {
    try {
      const { equation } = data;
      const result = executeEquation(equation, parser);
      parentPort!.postMessage({ success: true, result } as WorkerResponse);
    } catch (error) {
      parentPort!.postMessage({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      } as WorkerResponse);
    }
  });

  process.on('uncaughtException', (error: Error) => {
    parentPort!.postMessage({
      success: false,
      error: error.message || 'Uncaught exception occurred',
    } as WorkerResponse);
  });

  process.on('unhandledRejection', (error: Error | null) => {
    parentPort!.postMessage({
      success: false,
      error: error?.message || 'Unhandled rejection occurred',
    } as WorkerResponse);
  });
}
