import { ShardClient } from 'detritus-client';
import { Endpoints } from 'detritus-client-rest';

import { Store } from './store';


export type UserAvatarDecorationStored = {id: string, name: string, url: string};

// Stores User Avatar Decoration Urls
class UserAvatarDecorationStore extends Store<string, UserAvatarDecorationStored> {
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
    if (this.has(skuId)) {
      return this.get(skuId)!;
    }

    const url = Endpoints.CDN.URL + Endpoints.CDN.AVATAR_DECORATION(hash);

    let item: UserAvatarDecorationStored;
    try {
      const response = await shard.rest.fetchStorePublishedListingsSku(skuId);
      item = {id: skuId, name: response.sku.name, url};
    } catch(error) {
      item = {id: skuId, name: skuId, url};
    }
    this.insert(item);
    return item;
  }
}

export default new UserAvatarDecorationStore();
