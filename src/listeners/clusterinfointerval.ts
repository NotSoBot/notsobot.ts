import { ClusterClient, ShardClient } from 'detritus-client';
import { EventSubscription, Timers } from 'detritus-utils';

import { Listener } from './listener';

import { putInfoDiscord } from '../api';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RedisPayloads } from '../types';


class ClusterInfoInterval extends Listener {
  interval = new Timers.Interval();
  intervalTime = 15000;

  create(cluster: ClusterClient, redis: RedisSpewer) {
    console.log('LISTENER REFRESH'.repeat(100));
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = redis.subscribe(RedisChannels.INFO_DISCORD_REQUEST, async (payload: RedisPayloads.InfoDiscordRequest) => {
        console.log('DISCORD REQUEST'.repeat(100));
        const shard = cluster.shards.first();
        if (shard) {
          try {
            const usage = process.memoryUsage();
  
            await putInfoDiscord({client: shard}, {
              clusterId: cluster.clusterId,
              ramUsage: usage.heapUsed + usage.external + Math.max(0, usage.rss - usage.heapTotal),
              shardCount: cluster.shardCount,
              shardsPerCluster: 8,
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
  
          }
        }
      });
      subscriptions.push(subscription);
    }

    /*
    this.interval.start(this.intervalTime, async () => {
      const shard = cluster.shards.first();
      if (shard) {
        try {
          const usage = process.memoryUsage();

          await putInfoDiscord({client: shard}, {
            clusterId: cluster.clusterId,
            ramUsage: usage.heapUsed + usage.external + Math.max(0, usage.rss - usage.heapTotal),
            shardCount: cluster.shardCount,
            shardsPerCluster: 8,
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

        }
      }
    });
    */

    return subscriptions;
  }

  stop(cluster: ClusterClient | ShardClient) {
    super.stop(cluster);
    this.interval.stop();
  }
}

export default new ClusterInfoInterval();
