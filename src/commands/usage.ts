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
        return cluster.shards.reduce((information, shard) => {
          information.applications += shard.applications.length;
          information.channels += shard.channels.length;
          information.emojis += shard.emojis.length;
          information.guilds += shard.guilds.length;
          information.members += shard.members.length;
          information.messages += shard.messages.length;
          information.notes += shard.notes.length;
          information.presences += shard.presences.length;
          information.relationships += shard.relationships.length;
          information.sessions += shard.sessions.length;
          information.typing += shard.typing.length;
          information.users += shard.users.length;
          information.voiceCalls += shard.voiceCalls.length;
          information.voiceConnections += shard.voiceConnections.length;
          information.voiceStates += shard.voiceStates.length;
          return information;
        }, {
          usage: process.memoryUsage().rss,
          applications: 0,
          channels: 0,
          emojis: 0,
          guilds: 0,
          members: 0,
          messages: 0,
          notes: 0,
          presences: 0,
          relationships: 0,
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

      info.usage = `${Math.round((info.usage / 1024 / 1024) * 100) / 100} MB`;
      for (let key in info) {
        const title = key.slice(0, 1).toUpperCase() + key.slice(1);
        rows.push([`${title}:`, String(info[key])]);
      }
    }

    return context.editOrReply([
      '```py',
      padCodeBlock(rows).join('\n'),
      '```',
    ].join('\n'));
  },
});
