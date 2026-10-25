// what the tagscript (or the code/mediascript it ran) got wrong, not our own failures, so command tracking and sentry can
// tell them apart (`isTagError`). keeps `Error` as its name, users see the same `Error: ...` as before
export class TagError extends Error {
  // checked instead of `instanceof`, a `.refresh` reloads this module but not the bot.ts handlers that check it
  readonly isTagError = true;
}

export function isTagError(error: any): boolean {
  return !!error && error.isTagError === true;
}


export class TagExitError extends TagError {
  isSilent: boolean = false;

  constructor(message: string, isSilent: boolean = false) {
    super(message);
    this.name = 'TagExitError';
    this.isSilent = isSilent;
  }
}


export class TagRequestError extends TagError {
  constructor(message: string) {
    super(message);
    this.name = 'TagRequestError';
  }
}


// thrown once a tag has run longer than its MAX_TIME, functions that catch errors (like {iferror}) let it through
export class TagTimeoutError extends TagError {
  constructor(message: string) {
    super(message);
    this.name = 'TagTimeoutError';
  }
}
