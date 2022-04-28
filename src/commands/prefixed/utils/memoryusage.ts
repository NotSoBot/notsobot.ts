import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandCategories } from '../../../constants';
import { editOrReply, padCodeBlockFromRows, splitTextByAmount } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { getClusterInformation } from './shards';


export const COMMAND_NAME = 'memoryusage';

export default class MemoryUsageCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Show the bot\'s current memory usage',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.UTILS,
        usage: `${COMMAND_NAME}`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  async run(context: Command.Context) {
    const title: Array<Array<string>> = [
      ['Shard:', String(context.shardId)],
    ];
    const rows: Array<Array<string>> = [
      ['C', 'RSS', 'HeapTotal', 'HeapUsed', 'External', 'Buffers'],
    ];

    let chunks: Array<{[key: string]: number}>;
    if (context.manager) {
      title.unshift(['Cluster:', String(context.manager.clusterId)]);
      chunks = await context.manager.broadcastEval(() => {
        return process.memoryUsage();
      });
    } else {
      chunks = [(<any> process.memoryUsage())];
    }

    for (let clusterId in chunks) {
      const chunk = chunks[clusterId];
      const row: Array<string> = [clusterId];
      for (let key in chunk) {
        const value = chunk[key];
        row.push(`${Math.round(value / 1024 / 1024)}`);
      }
      rows.push(row);
    }

    const total = chunks.reduce((x: {[key: string]: number}, chunk) => {
      for (let key in chunk) {
        const value = chunk[key];
        x[key] = (x[key] || 0) + value;
      }
      return x;
    }, {});
    {
      const row: Array<string> = ['T'];
      for (let key in total) {
        row.push(`${Math.round(total[key] / 1024 / 1024)}`);
      }
      rows.push(row);
    }

    const paddedRows = padCodeBlockFromRows(rows, {join: '| '});
    const largestRow = paddedRows.reduce((x: number, row: string) => Math.max(x, row.length), 0);
    paddedRows.splice(1, 0, '-'.repeat(largestRow));

    const content = [
      padCodeBlockFromRows(title).join('\n') + '\n',
      paddedRows.join('\n'),
    ].join('\n');

    const embed = new Embed();
    {
      const parts = splitTextByAmount(content, 1988, '\n');
      embed.setDescription(Markup.codeblock(parts.shift()!, {language: 'py'}));
      {
        const fieldParts = splitTextByAmount(parts.join('\n'), 1012, '\n');
        for (let part of fieldParts) {
          embed.addField('\u200b', Markup.codeblock(part, {language: '\py'}));
        }
      }
    }
    return editOrReply(context, {embed});
  }
}
