import { ClusterClient, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { Listener } from './listener';

import { putInfoDiscord } from '../api';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';


const MAX_TIME_BETWEEN = 1500;

class ClusterInfoInterval extends Listener {
  lastUpload = 0;

  async maybeUploadInformation(cluster: ClusterClient, force: boolean = false): Promise<void> {
    const lastUpload = this.lastUpload;
    if (!force && Date.now() - lastUpload <= MAX_TIME_BETWEEN) {
      return;
    }

    const shard = cluster.shards.first();
    if (shard) {
      try {
        const usage = process.memoryUsage();

        this.lastUpload = Date.now();
        await putInfoDiscord({client: shard}, {
          clusterId: cluster.clusterId,
          ramUsage: usage.heapUsed + usage.external + Math.max(0, usage.rss - usage.heapTotal),
          shardCount: cluster.shardCount,
          shardsPerCluster: (cluster.manager) ? cluster.manager.clusterShardsPer : 1,
          shards: cluster.shards.map((shard) => {
            return {
              shardId: shard.shardId,
              status: shard.gateway.state,

              applications: shard.applications.length,
              channels: shard.channels.length,
              channelThreads: shard.channels.filter((channel) => channel.isGuildThread).length,
              emojis: shard.emojis.length,
              events: shard.gateway.sequence,
              guilds: shard.guilds.length,
              guildScheduledEvents: shard.guildScheduledEvents.length,
              members: shard.members.length,
              memberCount: shard.guilds.reduce((x, guild) => x + guild.memberCount, 0),
              messages: shard.messages.length,
              permissionOverwrites: shard.channels.reduce((x, channel) => x + channel.permissionOverwrites.length, 0),
              presences: shard.presences.length,
              presenceActivities: shard.presences.reduce((x, presence) => x + presence.activities.length, 0),
              roles: shard.roles.length,
              stageInstances: shard.stageInstances.length,
              typings: shard.typings.length,
              users: shard.users.length,
              voiceStates: shard.voiceStates.length,
            };
          }),
        });
      } catch(error) {
        this.lastUpload = lastUpload;
      }
    }
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = redis.subscribe(RedisChannels.INFO_DISCORD_REQUEST, async (payload: RedisPayloads.InfoDiscordRequest) => {
        this.maybeUploadInformation(cluster, true);
      });
      subscriptions.push(subscription);
    }

    if (cluster.shards.length) {
      for (let [shardId, shard] of cluster.shards) {
        const gatewaySubscription = shard.gateway.subscribe('state', ({state}) => {
          this.maybeUploadInformation(cluster);
        });
        subscriptions.push(gatewaySubscription);
      }
    } else {
      const subscription = cluster.subscribe(ClientEvents.SHARD, ({shard}) => {
        const gatewaySubscription = shard.gateway.subscribe('state', ({state}) => {
          this.maybeUploadInformation(cluster);
        });
        subscriptions.push(gatewaySubscription);
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new ClusterInfoInterval();
