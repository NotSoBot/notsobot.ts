import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export default class PingCommand extends BaseCommand {
  name = 'ping';
  metadata = {
    description: 'Ping Discord\'s Gateway and Rest api',
    type: CommandTypes.UTILS,
    usage: 'ping',
  };

  async run(context: Command.Context) {
    const {gateway, rest} = await context.client.ping();
    return context.editOrReply(`pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`);
  }
}
