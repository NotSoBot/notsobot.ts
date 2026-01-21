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
