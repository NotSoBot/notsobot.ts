export class TagExitError extends Error {
  isSilent: boolean = false;

  constructor(message: string, isSilent: boolean = false) {
    super(message);
    this.name = 'TagExitError';
    this.isSilent = isSilent;
  }
}


export class TagRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagRequestError';
  }
}


// thrown once a tag has run longer than its MAX_TIME, functions that catch errors (like {iferror}) let it through
export class TagTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagTimeoutError';
  }
}
