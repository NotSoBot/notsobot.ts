// no imports on purpose, `sentry.ts` needs these without pulling in the rest of utils


// `.refresh` reloads this module, so a module it didn't reload (or a run that started before it) throws errors made from
// the old copy of a class, and a plain `instanceof` against the new one is false: the cancelled runs and user errors
// that got reported to sentry. instances carry a `Symbol.for` brand (the registry is process wide, a reload gets the
// same symbol) and `instanceof` checks it, so every check keeps working across reloads
const USER_ERROR: unique symbol = Symbol.for('notsobot.errors.UserError');
const COMMAND_RUN_CANCELLED_ERROR: unique symbol = Symbol.for('notsobot.errors.CommandRunCancelledError');
const DISCORD_LINK_ERROR: unique symbol = Symbol.for('notsobot.errors.DiscordLinkError');
const INTERACTION_EXPIRED_ERROR: unique symbol = Symbol.for('notsobot.errors.InteractionExpiredError');

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


// a discord link given as media that can't be used (a message the user can't read, an invite), the media parameters
// pass it on instead of treating it like no media was found
export class DiscordLinkError extends UserError {
  name = 'DiscordLinkError';
  readonly [DISCORD_LINK_ERROR] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return isBranded(value, DISCORD_LINK_ERROR);
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


// an interaction's first response that was never sent: discord only takes one within 3 seconds of the interaction being
// made and it was already past that (a stalled event loop, slow checks before the defer). the request would only have
// come back as a 404 Unknown interaction and nothing reaches the user anymore, so nothing reports it
export class InteractionExpiredError extends Error {
  name = 'InteractionExpiredError';
  readonly [INTERACTION_EXPIRED_ERROR] = true;

  constructor(age: number) {
    super(`Interaction expired before its response (${age}ms old)`);
  }

  static [Symbol.hasInstance](value: unknown): boolean {
    return isBranded(value, INTERACTION_EXPIRED_ERROR);
  }
}
