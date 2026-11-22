import { ShardClient } from 'detritus-client';
import { Endpoints } from 'detritus-client-rest';

import { Store } from './store';


// `name` is null when discord has no store listing for it (quest rewards, promos, etc..) or the lookup failed
export type UserAvatarDecorationStored = {id: string, name: null | string, url: string};

// what discord answers for a decoration with no store listing, that stays true so it's cached like a name. anything else
// (5xx, a ratelimit, a timeout, our own 401 latch) is a failed lookup, tried again by the next use instead of showing it
// unnamed for the whole 12 hours
const NO_LISTING_STATUS_CODES: ReadonlyArray<number> = [400, 403, 404];

// the decoration's name, null when it has none. old entries from before `name` could be null used the sku id instead
export function getAvatarDecorationName(item: UserAvatarDecorationStored): null | string {
  return (item.name && item.name !== item.id) ? item.name : null;
}

// Stores User Avatar Decoration Urls
class UserAvatarDecorationStore extends Store<string, UserAvatarDecorationStored> {
  // lookups going on, everyone with the same decoration at once (a server's members in the logs) shares one
  fetching = new Map<string, Promise<UserAvatarDecorationStored>>();

  constructor() {
	  // 12 hours
    super({expire: 12 * 60 * 60 * 1000});
  }

  insert(payload: UserAvatarDecorationStored): void {
    this.set(payload.id, payload);
  }

  async getOrFetch(
    shard: ShardClient,
    skuId: string,
    hash: string,
  ): Promise<UserAvatarDecorationStored> {
    const cached = this.get(skuId);
    if (cached) {
      return cached;
    }
    let promise = this.fetching.get(skuId);
    if (!promise) {
      promise = this.fetchDecoration(shard, skuId, hash).finally(() => this.fetching.delete(skuId));
      this.fetching.set(skuId, promise);
    }
    return promise;
  }

  async fetchDecoration(shard: ShardClient, skuId: string, hash: string): Promise<UserAvatarDecorationStored> {
    const url = Endpoints.CDN.URL + Endpoints.CDN.AVATAR_DECORATION(hash);
    try {
      const response = await shard.rest.fetchStorePublishedListingsSku(skuId);
      const item = {id: skuId, name: response.sku.name || null, url};
      this.insert(item);
      return item;
    } catch(error: any) {
      const item = {id: skuId, name: null, url};
      const statusCode = error && error.response && error.response.statusCode;
      if (NO_LISTING_STATUS_CODES.includes(statusCode)) {
        this.insert(item);
      }
      return item;
    }
  }
}

export default new UserAvatarDecorationStore();
