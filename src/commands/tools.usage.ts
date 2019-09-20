import * as os from 'os';

import { Command, ClusterClient } from 'detritus-client';

import { padCodeBlockFromRows } from '../utils';


export default (<Command.CommandOptions> {
  name: 'usage',
  ratelimit: {
    duration: 5000,
    limit: 3,
    type: 'guild',
  },
  run: async (context, args) => {
    const rows: Array<Array<string>> = [];
    if (context.manager) {
      const results = await context.manager.broadcastEval((cluster: ClusterClient) => {
        const usage = process.memoryUsage();
        return cluster.shards.reduce((information, shard) => {
          information.shardsLoaded += 1;
          information.applications += shard.applications.length;
          information.channels += shard.channels.length;
          information.emojis += shard.emojis.length;
          information.events += shard.gateway.sequence;
          information.guilds += shard.guilds.length;
          information.members += shard.members.length;
          information.memberCount += shard.guilds.reduce((x, guild) => x + guild.memberCount, 0);
          information.messages += shard.messages.length;
          information.notes += shard.notes.length;
          information.permissionOverwrites += shard.channels.reduce((x, channel) => x + channel.permissionOverwrites.length, 0);
          information.presences += shard.presences.length;
          information.presenceActivities += shard.presences.reduce((x, presence) => x + presence.activities.length, 0);
          information.relationships += shard.relationships.length;
          information.roles += shard.roles.length;
          information.sessions += shard.sessions.length;
          information.typings += shard.typings.length;
          information.users += shard.users.length;
          information.voiceCalls += shard.voiceCalls.length;
          information.voiceConnections += shard.voiceConnections.length;
          information.voiceStates += shard.voiceStates.length;
          return information;
        }, {
          cluster: 1,
          shard: 0,
          shardsLoaded: 0,
          ramUsage: Math.max(usage.rss, usage.heapTotal + usage.external),
          ramTotal: 0,
          applications: 0,
          channels: 0,
          emojis: 0,
          events: 0,
          guilds: 0,
          members: 0,
          memberCount: 0,
          messages: 0,
          notes: 0,
          permissionOverwrites: 0,
          presences: 0,
          presenceActivities: 0,
          relationships: 0,
          roles: 0,
          sessions: 0,
          typings: 0,
          users: 0,
          voiceCalls: 0,
          voiceConnections: 0,
          voiceStates: 0,
        });
      });

      const info: any = results.reduce((x: any, information: any) => {
        for (let key in information) {
          if (!(key in x)) {
            x[key] = 0;
          }
          x[key] += information[key];
        }
        return x;
      }, {});

      info.cluster = `${context.manager.clusterId}/${info.cluster}`;
      info.shard = `${context.shardId}/${context.shardCount}`;
      info.shardsLoaded = `${info.shardsLoaded}/${context.shardCount}`;
      info.ramUsage = `${Math.round(info.ramUsage / 1024 / 1024).toLocaleString()} MB`;
      info.ramTotal = `${Math.round(os.totalmem() / 1024 / 1024).toLocaleString()} MB`;
      for (let key in info) {
        const title = key.slice(0, 1).toUpperCase() + key.slice(1);

        let value: string;
        if (typeof(info[key]) === 'number') {
          value = info[key].toLocaleString();
        } else {
          value = info[key];
        }
        rows.push([`${title}:`, value]);
      }
    }

    return context.editOrReply([
      '```py',
      padCodeBlockFromRows(rows).join('\n'),
      '```',
    ].join('\n'));
  },
});
