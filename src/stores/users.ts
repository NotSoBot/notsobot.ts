import { ClusterClient, Command, GatewayClientEvents } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';

import { fetchUser, putUser } from '../api';
import { User } from '../api/structures/user';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';


// Stores NotSoApi User Object
class UserStore extends Store<string, User> {
  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  insert(payload: User): void {
    this.set(payload.id, payload);
  }

  async getOrFetch(context: Command.Context, userId: string): Promise<User | null> {
    let user: User | null = null;
    if (UserPromisesStore.has(userId)) {
      const promise = UserPromisesStore.get(userId) as UserPromise;
      user = await promise;
    } else {
      if (this.has(userId)) {
        user = this.get(userId) as User;
      } else {
        user = await this.fetch(context, userId);
      }
    }
    return user;
  }

  async fetch(context: Command.Context, userId: string): Promise<User | null> {
    let promise: UserPromise;
    if (UserPromisesStore.has(userId)) {
      promise = UserPromisesStore.get(userId) as UserPromise;
    } else {
      promise = new Promise(async (resolve) => {
        const discordUser = context.users.get(userId);
        try {
          let user: User | null = null;
          if (discordUser) {
            user = await putUser(context, userId, {
              avatar: discordUser.avatar,
              bot: discordUser.bot,
              discriminator: discordUser.discriminator,
              username: discordUser.username,
            });
          } else {
            user = await fetchUser(context, userId);
          }
          this.insert(user);
          resolve(user);
        } catch(error) {
          resolve(null);
        }
        UserPromisesStore.delete(userId);
      });
      UserPromisesStore.insert(userId, promise);
    }
    return promise;
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    return subscriptions;
  }
}

export default new UserStore();



export type UserPromise = Promise<User | null>;

class UserPromises extends Store<string, UserPromise> {
  insert(guildId: string, promise: UserPromise): void {
    this.set(guildId, promise);
  }
}

export const UserPromisesStore = new UserPromises();
