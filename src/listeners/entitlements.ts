import { ClusterClient, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { Listener } from './listener';

import { RedisSpewer } from '../redis';


// Do I want to interval here for the current users entitlements or in the api

class EntitlementsListener extends Listener {
  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.ENTITLEMENT_CREATE, async (event) => {
        const { entitlement, shard } = event;
        if (entitlement.applicationId !== shard.applicationId) {
          return;
        }

      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.ENTITLEMENT_DELETE, async (event) => {
        const { entitlement, shard } = event;
        if (entitlement.applicationId !== shard.applicationId) {
          return;
        }

      });
      subscriptions.push(subscription);
    }

    {
      const subscription = cluster.subscribe(ClientEvents.ENTITLEMENT_UPDATE, async (event) => {
        const { entitlement, shard } = event;
        if (entitlement.applicationId !== shard.applicationId) {
          return;
        }

      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new EntitlementsListener();
