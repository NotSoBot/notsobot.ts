import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DisplayPayload, displayReply, padCodeBlockFromRows, splitTextByAmount } from '../../../utils';


export const COMMAND_ID = 'bot.memory.usage';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const title: Array<Array<string>> = [
    ['Shard:', String(context.client.shardId)],
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

  if (5900 < content.length) {
    return await displayReply(context, {files: [{filename: `usage.json`, value: content}]});
  }

  const payload: DisplayPayload = {fields: []};
  {
    const parts = splitTextByAmount(content, 1988, '\n');
    payload.description = Markup.codeblock(parts.shift()!, {language: 'py'});
    {
      const fieldParts = splitTextByAmount(parts.join('\n'), 1012, '\n');
      for (let part of fieldParts) {
        payload.fields!.push({name: '\u200b', value: Markup.codeblock(part, {language: '\py'})});
      }
    }
  }
  return displayReply(context, payload);
}
