const SAFE_FUNCTIONS = [
  // Trig
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',

  // Exponential / logarithmic
  'exp', 'log', 'log2', 'log10', 'log1p', 'expm1',
  'sqrt', 'cbrt', 'nthRoot', 'pow', 'square', 'cube',

  // Rounding
  'round', 'floor', 'ceil', 'fix', 'sign',

  // Basic arithmetic helpers
  'abs', 'add', 'subtract', 'multiply', 'divide', 'mod',
  'min', 'max', 'hypot',

  // Combinatorics (cheap for small inputs)
  'gcd', 'lcm',

  // Constants
  'pi', 'e', 'tau', 'phi', 'PI', 'E',
  'Infinity', 'NaN', 'true', 'false',
];

const SAFE_PATTERN = new RegExp(
  `^(?:[\\d\\s+\\-*/().%^,]|\\b(?:${SAFE_FUNCTIONS.join('|')})\\b)+$`
);

export function isSimpleMath(equation: string): boolean {
  return SAFE_PATTERN.test(equation);
}
