import { runInNewContext } from 'vm';
import { parentPort } from 'worker_threads';

import * as mathjs from 'mathjs';



export const MathJS = mathjs.create(mathjs.all, {
  number: 'BigNumber',  
});

MathJS.import({
  import: function () {throw new Error('Function import is disabled')},
}, {override: true});

export const ERROR_TIMEOUT_MESSAGE = 'Script execution timed out after';
export const MAX_TIME_MATH = 500;


export function executeEquation(equation: string, parser: mathjs.Parser | null = null): string {
  equation = equation.replace(/\*\*/g, '^');
  parser = parser || MathJS.parser();
  const result = parser.evaluate(equation);
  return formatNumber(result);
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


function formatNumber(value: number | bigint | mathjs.Complex | mathjs.BigNumber | mathjs.Unit, places: number = 2, maxPrecision: number = 20): string {
  if (isString(value)) {
    return value.toString();
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


function isRepeatingDecimal(value: string, maxDigits: number = 20): boolean {
  const decimal = value.split('.')[1];
  if (decimal) {
    const firstDigit = decimal[0];
    return decimal.split('').every((x) => x === firstDigit);
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
  const parser = MathJS.parser();
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
