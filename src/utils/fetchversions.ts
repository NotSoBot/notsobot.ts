// keeps a store's fetch from caching an older copy over a newer write. A fetch takes the key's version when it starts,
// every write to the key while one is going (an api event, a command's own result, a resync dropping everything) bumps
// it, and the fetch only caches what it got if nothing did. Without it an event that came in while the fetch was going
// (nothing cached yet for it to update) was lost, and the fetch's older copy was kept until the cache expired.
// a key is only tracked while a fetch for it is going

export class FetchVersions<K> {
  items = new Map<K, {fetches: number, version: number}>();

  // a fetch for the key is starting, hand its version back to `end()`
  start(key: K): number {
    let item = this.items.get(key);
    if (!item) {
      item = {fetches: 0, version: 0};
      this.items.set(key, item);
    }
    item.fetches++;
    return item.version;
  }

  // the fetch is done (or failed, still call it), whether it can cache what it got: nothing wrote to the key since `start()`
  end(key: K, version: number): boolean {
    const item = this.items.get(key);
    if (!item) {
      // started before this existed (a `.refresh` added it to an old store), it can't tell so it doesn't cache
      return false;
    }
    if (!--item.fetches) {
      this.items.delete(key);
    }
    return item.version === version;
  }

  // the key was written, any fetch going for it has an older copy now
  bump(key: K): void {
    const item = this.items.get(key);
    if (item) {
      item.version++;
    }
  }

  // everything was dropped (a resync)
  bumpAll(): void {
    for (let item of this.items.values()) {
      item.version++;
    }
  }
}
