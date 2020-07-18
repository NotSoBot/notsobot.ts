import { Command } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';
import { padCodeBlockFromRows } from '../../utils';

import { getClusterInformation } from './shards';


export default class MemoryUsageCommand extends BaseCommand {
  name = 'memoryusage';
  metadata = {
    description: 'Show the bot\'s current memory usage',
    examples: [
      'memoryusage',
    ],
    type: CommandTypes.UTILS,
    usage: 'memoryusage',
  };

  async run(context: Command.Context) {
    const title: Array<Array<string>> = [
      ['Shard:', String(context.shardId)],
    ];
    const rows: Array<Array<string>> = [
      ['C', 'RSS', 'HeapTotal', 'HeapUsed', 'External'],
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
    return context.editOrReply(Markup.codeblock(content, {language: 'py'}));
  }
}
