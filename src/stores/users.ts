import { ClusterClient, Command, Interaction } from 'detritus-client';
import { EventSubscription, Timers } from 'detritus-utils';

import { Store } from './store';

import { fetchUser, putUser } from '../api';
import { UserFull } from '../api/structures/user';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';


// Stores NotSoApi User Object
class UserStore extends Store<string, UserFull> {
  constructor() {
    // 2 hours
    super({expire: 2 * 60 * 60 * 1000});
  }

  insert(payload: UserFull): void {
    this.set(payload.id, payload);
  }

  async getOrFetch(
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
    userId: string,
  ): Promise<UserFull | null> {
    let user: UserFull | null = null;
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

  async fetch(
    context: Command.Context | Interaction.InteractionContext | Interaction.InteractionAutoCompleteContext,
    userId: string,
  ): Promise<UserFull | null> {
    let promise: Promise<UserFull | null>;
    if (UserPromisesStore.has(userId)) {
      promise = UserPromisesStore.get(userId)!.promise;
    } else {
      const timeout = new Timers.Timeout();
      promise = new Promise(async (resolve) => {
        timeout.start(5000, () => {
          UserPromisesStore.delete(userId);
          resolve(null);
        });

        let discordUser = context.users.get(userId);
        try {
          if (!discordUser) {
            discordUser = await context.rest.fetchUser(userId);
          }

          let user: UserFull | null = null;
          if (discordUser) {
            let channelId: string | undefined;
            if (discordUser.id === context.userId) {
              if (context.inDm && context.hasServerPermissions) {
                channelId = context.channelId;
              }
            }
            user = await putUser(context, userId, {
              avatar: discordUser.avatar,
              bot: discordUser.bot,
              channelId,
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



export type UserPromiseItem = {promise: Promise<UserFull | null>, timeout: Timers.Timeout};

class UserPromises extends Store<string, UserPromiseItem> {
  insert(userId: string, item: UserPromiseItem): void {
    this.set(userId, item);
  }
}

export const UserPromisesStore = new UserPromises();
