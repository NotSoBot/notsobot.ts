export class TagExitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagExitError';
  }
}


export class TagRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagRequestError';
  }
}
