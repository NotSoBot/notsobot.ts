// a list that's loaded once from the api and then kept up to date by events (the premium stores). a failed load isn't
// tried again until `retryAfter` has passed, and `reset()` (a resync) makes the next use load it again

export type LoadOnceState =
  {status: 'unloaded'} |
  {status: 'loading', promise: Promise<boolean>} |
  {status: 'loaded'} |
  // counts as unloaded once `retryAfter` has passed
  {status: 'failed', at: number};


export class LoadOnce<K> {
  // bumped on a reset, a load that started before one doesn't count
  generation: number = 0;
  retryAfter: number;
  state: LoadOnceState = {status: 'unloaded'};
  // updated by an event while loading, the loaded list could be from before it
  updatedWhileLoading = new Set<K>();

  constructor(retryAfter: number) {
    this.retryAfter = retryAfter;
  }

  get isLoaded(): boolean {
    return this.state.status === 'loaded';
  }

  // an event changed this key, the load that's going (if any) mustn't overwrite it with its older copy
  markUpdated(key: K): void {
    if (this.state.status === 'loading') {
      this.updatedWhileLoading.add(key);
    }
  }

  // events were missed, load it all again on the next use. a load that's going is ignored when it's done
  reset(): void {
    this.generation++;
    this.state = {status: 'unloaded'};
  }

  // whether it's loaded. `fetch` is called right away, `apply` puts its data in (skipping `updatedWhileLoading`'s keys)
  // unless a reset happened meanwhile, the load after it takes over then
  load<T>(fetch: () => Promise<T>, apply: (data: T, updatedWhileLoading: Set<K>) => void): Promise<boolean> {
    const state = this.state;
    switch (state.status) {
      case 'loaded': return Promise.resolve(true);
      case 'loading': return state.promise;
      case 'failed': {
        if (Date.now() - state.at < this.retryAfter) {
          return Promise.resolve(false);
        }
      }; break;
    }

    this.updatedWhileLoading.clear();
    const generation = this.generation;
    const promise = (async () => {
      try {
        const data = await fetch();
        if (generation !== this.generation) {
          return false;
        }
        apply(data, this.updatedWhileLoading);
        this.state = {status: 'loaded'};
      } catch(error) {
        if (generation === this.generation) {
          this.state = {status: 'failed', at: Date.now()};
        }
      }
      return this.isLoaded;
    })();
    // a fetch that throws right away settles the promise before this, it's failed by now and stays that way
    if (this.state === state) {
      this.state = {status: 'loading', promise};
    }
    return promise;
  }
}
