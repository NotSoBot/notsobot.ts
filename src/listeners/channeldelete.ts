import { ClusterClient, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { sweepGuild } from '../api';
import { ApiEventsSpewer } from '../apievents';

import { Listener } from './listener';


class ChannelDeleteListener extends Listener {
  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.CHANNEL_DELETE, async (event) => {
        const { channel, shard } = event;
        const { guildId } = channel;

        // everything the server kept for it goes, same as the settings sweep
        if (guildId) {
          try {
            await sweepGuild({client: shard}, guildId, {channelIds: [channel.id]});
          } catch(e) {

          }
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new ChannelDeleteListener();
