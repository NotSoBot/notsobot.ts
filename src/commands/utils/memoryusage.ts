import { ClusterClient, Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { CommandTypes } from '../../constants';
import { onRunError, padCodeBlockFromRows } from '../../utils';


export default (<Command.CommandOptions> {
  name: 'memoryusage',
  metadata: {
    description: 'Show the bot\'s current memory usage',
    examples: [
      'memoryusage',
    ],
    type: CommandTypes.UTILS,
    usage: 'memoryusage',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  run: async (context) => {
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
  },
  onRunError,
});