// no imports on purpose, `sentry.ts` needs these without pulling in the rest of utils


// `.refresh` reloads this module, so a module it didn't reload (or a run that started before it) throws errors made from
// the old copy of a class, and a plain `instanceof` against the new one is false: the cancelled runs and user errors
// that got reported to sentry. instances carry a `Symbol.for` brand (the registry is process wide, a reload gets the
// same symbol) and `instanceof` checks it, so every check keeps working across reloads
const USER_ERROR: unique symbol = Symbol.for('notsobot.errors.UserError');
const COMMAND_RUN_CANCELLED_ERROR: unique symbol = Symbol.for('notsobot.errors.CommandRunCancelledError');

function isBranded(value: unknown, brand: symbol): boolean {
  return typeof(value) === 'object' && value !== null && (value as any)[brand] === true;
}


// a translated message for the user (bad input, a disabled feature, etc..), the reply explains it so sentry skips it
export class UserError extends Error {
  name = 'UserError';
  readonly [USER_ERROR] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return isBranded(value, USER_ERROR);
  }
}


// thrown in a prefixed command run that got cancelled by its trigger being edited or deleted, nothing reports it
export class CommandRunCancelledError extends Error {
  name = 'CommandRunCancelledError';
  readonly [COMMAND_RUN_CANCELLED_ERROR] = true;

  constructor() {
    super('Command run was cancelled');
  }

  static [Symbol.hasInstance](value: unknown): boolean {
    return isBranded(value, COMMAND_RUN_CANCELLED_ERROR);
  }
}
