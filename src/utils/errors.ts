// no imports on purpose, `sentry.ts` needs these without pulling in the rest of utils


// a translated message for the user (bad input, a disabled feature, etc..), the reply explains it so sentry skips it
export class UserError extends Error {
  name = 'UserError';
}


// thrown in a prefixed command run that got cancelled by its trigger being edited or deleted, nothing reports it
export class CommandRunCancelledError extends Error {
  name = 'CommandRunCancelledError';

  constructor() {
    super('Command run was cancelled');
  }
}
