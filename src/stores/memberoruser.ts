import { Structures } from 'detritus-client';

import { Store } from './store';


export type MemberOrUser = Structures.Member | Structures.User | null;

// Stores if we fetched a guild via the rest api or not
class MemberOrUserStore extends Store<string, MemberOrUser> {
  constructor() {
    super({expire: (2 * 60) * 1000});
  }

  insert(key: string, payload: MemberOrUser): void {
    this.set(key, payload);
  }
}

export default new MemberOrUserStore();
