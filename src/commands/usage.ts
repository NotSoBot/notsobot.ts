import { Command, ClusterClient } from 'detritus-client';

import { padCodeBlock } from '../utils';


export default (<Command.CommandOptions> {
  name: 'usage',
  ratelimit: {
    duration: 5000,
    limit: 3,
    type: 'guild',
  },
  run: async (context, args) => {
    const rows: Array<Array<string>> = [
      ['Shard:', String(context.shardId)],
    ];

    if (context.manager) {
      rows.unshift(['Cluster:', String(context.manager.clusterId)]);

      const results = await context.manager.broadcastEval((cluster: ClusterClient) => {
        const usage = process.memoryUsage();
        return cluster.shards.reduce((information, shard) => {
          information.applications += shard.applications.length;
          information.channels += shard.channels.length;
          information.emojis += shard.emojis.length;
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
          information.typing += shard.typing.length;
          information.users += shard.users.length;
          information.voiceCalls += shard.voiceCalls.length;
          information.voiceConnections += shard.voiceConnections.length;
          information.voiceStates += shard.voiceStates.length;
          return information;
        }, {
          usage: Math.max(usage.rss, usage.heapTotal + usage.external),
          applications: 0,
          channels: 0,
          emojis: 0,
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
          typing: 0,
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

      info.usage = `${Math.round(info.usage / 1024 / 1024).toLocaleString()} MB`;
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
      padCodeBlock(rows).join('\n'),
      '```',
    ].join('\n'));
  },
});
