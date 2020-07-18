import * as os from 'os';


import { ClusterClient, Command, Utils } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';
import { padCodeBlockFromRows } from '../../utils';

import { ClusterInformation, getClusterInformation } from './shards';


export default class UsageCommand extends BaseCommand {
  name = 'usage';
  metadata = {
    description: 'Show the bot\'s current usage (and Discord object counts)',
    examples: [
      'usage',
    ],
    type: CommandTypes.UTILS,
    usage: 'usage',
  };


  async run(context: Command.Context) {
    const rows: Array<Array<string>> = [];
    if (context.manager) {
      const results = await getClusterInformation(context);
      const info = results.reduce((x: ClusterInformation, information) => {
        for (let key in information) {
          const value = (information as any)[key];
          switch (typeof(value)) {
            case 'object': {
              for (let childKey in value) {
                const childValue = (value as any)[childKey];
                const cache = (x as any)[key];
                if (childKey in cache) {
                  cache[childKey] += childValue;
                } else {
                  cache[childKey] = childValue;
                }
              }
            }; break;
            case 'number': {
              if (key in x) {
                (x as any)[key] += value;
              } else {
                (x as any)[key] = value;
              }
            }; break;
          }
        }
        return x;
      }, {
        memory: {},
        objects: {},
        ramUsage: 0,
        shardsIdentified: 0,
      } as ClusterInformation);

      rows.push(['Cluster:', `${context.manager.clusterId}/${context.manager.clusterCount}`]);
      rows.push(['ShardsIdentified:', `${info.shardsIdentified} of ${context.shardCount}`]);
      rows.push(['RamUsage:', `${Math.round(info.ramUsage / 1024 / 1024).toLocaleString()} MB`]);
      rows.push(['RamTotal:', `${Math.round(os.totalmem() / 1024 / 1024).toLocaleString()} MB`]);
      for (let key in info.objects) {
        const title = key.slice(0, 1).toUpperCase() + key.slice(1);

        let text: string;
        const value = (info.objects as any)[key];
        switch (typeof(value)) {
          case 'number': {
            text = value.toLocaleString();
          }; break;
          case 'string': {
            text = value;
          }; break;
          default: continue;
        }
        rows.push([`${title}:`, text]);
      }
    }

    const content = padCodeBlockFromRows(rows).join('\n');
    return context.editOrReply(Markup.codeblock(content, {language: 'py'}));
  }
}
