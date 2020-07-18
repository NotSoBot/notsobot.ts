import { ClusterClient, Command } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';
import { SocketStates } from 'detritus-client-socket/lib/constants';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';
import { padCodeBlockFromRows } from '../../utils';


export interface ClusterInformation {
  memory: {
    external: number,
    heapTotal: number,
    heapUsed: number,
    rss: number,
  },
  objects: ClusterObjectInformation,
  ramUsage: number,
  shardsIdentified: number,
}

export interface ClusterObjectInformation {
  applications: number,
  channels: number,
  emojis: number,
  events: number,
  guilds: number,
  members: number,
  memberCount: number,
  messages: number,
  notes: number,
  permissionOverwrites: number,
  presences: number,
  presenceActivities: number,
  relationships: number,
  roles: number,
  sessions: number,
  typings: number,
  users: number,
  voiceCalls: number,
  voiceConnections: number,
  voiceStates: number,
}

export async function getClusterInformation(context: Command.Context): Promise<Array<ClusterInformation>> {
  if (context.manager) {
    const results = await context.manager.broadcastEval((cluster: ClusterClient) => {
      const usage = process.memoryUsage();
      const information: ClusterInformation = {
        memory: usage,
        objects: {
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
        },
        ramUsage: usage.heapUsed + usage.external +  Math.max(0, usage.rss - usage.heapTotal),
        shardsIdentified: 0,
      };
      for (let [shardId, shard] of cluster.shards) {
          if (shard.gateway.state === SocketStates.READY) {
            information.shardsIdentified += 1;
          }
          information.objects.applications += shard.applications.length;
          information.objects.channels += shard.channels.length;
          information.objects.emojis += shard.emojis.length;
          information.objects.events += shard.gateway.sequence;
          information.objects.guilds += shard.guilds.length;
          information.objects.members += shard.members.length;
          information.objects.memberCount += shard.guilds.reduce((x, guild) => x + guild.memberCount, 0);
          information.objects.messages += shard.messages.length;
          information.objects.notes += shard.notes.length;
          information.objects.permissionOverwrites += shard.channels.reduce((x, channel) => x + channel.permissionOverwrites.length, 0);
          information.objects.presences += shard.presences.length;
          information.objects.presenceActivities += shard.presences.reduce((x, presence) => x + presence.activities.length, 0);
          information.objects.relationships += shard.relationships.length;
          information.objects.roles += shard.roles.length;
          information.objects.sessions += shard.sessions.length;
          information.objects.typings += shard.typings.length;
          information.objects.users += shard.users.length;
          information.objects.voiceCalls += shard.voiceCalls.length;
          information.objects.voiceConnections += shard.voiceConnections.length;
          information.objects.voiceStates += shard.voiceStates.length;
      }
      return information;
    });
    return results;
  }
  return [];
}


export default class ShardCommand extends BaseCommand {
  name = 'shards';

  metadata = {
    description: 'Show all of the bot\'s shard information',
    examples: [
      'shards',
    ],
    type: CommandTypes.UTILS,
    usage: 'shards',
  };

  async run(context: Command.Context) {
    const title: Array<Array<string>> = [
      ['Shard:', String(context.shardId)],
    ];
    const rows: Array<Array<string>> = [
      ['C', 'G', 'M', 'RAM'],
    ];

    if (context.manager) {
      title.unshift(['Cluster:', String(context.manager.clusterId)]);

      const results = await getClusterInformation(context);
      for (let clusterId in results) {
        const information = results[clusterId];
        rows.push([
          clusterId,
          String(information.objects.guilds),
          String(information.objects.members),
          `${Math.round(information.ramUsage / 1024 / 1024)}`,
        ]);
      }

      const totalUsage = results.reduce((x: number, info: any) => x + info.ramUsage, 0);
      rows.push([
        'T',
        String(results.reduce((x: number, info: any) => x + info.objects.guilds, 0)),
        String(results.reduce((x: number, info: any) => x + info.objects.members, 0)),
        `${Math.round(totalUsage / 1024 / 1024)}`,
      ]);
    }

    const paddedRows = padCodeBlockFromRows(rows, {join: '| '});
    const largestRow = paddedRows.reduce((x: number, row: string) => Math.max(x, row.length), 0);
    paddedRows.splice(1, 0, '-'.repeat(largestRow));

    const content = [
      padCodeBlockFromRows(title).join('\n') + '\n',
      paddedRows.join('\n'),
    ].join('\n');
    return context.editOrReply(Markup.codeblock(content, {language: 'py'}));
  }
}
