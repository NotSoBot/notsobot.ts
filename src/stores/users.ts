import { ClusterClient, Command, Interaction } from 'detritus-client';
import { EventSubscription, Timers } from 'detritus-utils';

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

  async getOrFetch(context: Command.Context | Interaction.InteractionContext, userId: string): Promise<User | null> {
    let user: User | null = null;
    if (UserPromisesStore.has(userId)) {
      const { promise } = UserPromisesStore.get(userId)!;
      user = await promise;
    } else {
      if (this.has(userId)) {
        user = this.get(userId)!;
      } else {
        user = await this.fetch(context, userId);
      }
    }
    return user;
  }

  async fetch(context: Command.Context | Interaction.InteractionContext, userId: string): Promise<User | null> {
    let promise: Promise<User | null>;
    if (UserPromisesStore.has(userId)) {
      promise = UserPromisesStore.get(userId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      promise = new Promise(async (resolve) => {
        timeout.start(5000, () => {
          UserPromisesStore.delete(userId);
          resolve(null);
        });

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
        timeout.stop();
        UserPromisesStore.delete(userId);
      });
      UserPromisesStore.insert(userId, {promise, timeout});
    }
    return promise;
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = redis.subscribe(RedisChannels.USER_UPDATE, (payload: RedisPayloads.UserUpdate) => {
        if (this.has(payload.id)) {
          const user = this.get(payload.id)!;
          user.merge(payload);
        }
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new UserStore();



export type UserPromiseItem = {promise: Promise<User | null>, timeout: Timers.Timeout};

class UserPromises extends Store<string, UserPromiseItem> {
  insert(guildId: string, item: UserPromiseItem): void {
    this.set(guildId, item);
  }
}

export const UserPromisesStore = new UserPromises();
