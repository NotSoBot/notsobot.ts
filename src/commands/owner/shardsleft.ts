import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandTypes, DateMomentLogFormat } from '../../constants';
import { createTimestampMomentFromGuild, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {

}


export const COMMAND_NAME = 'shardsleft';

export default class ShardsLeftCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'See how many identifies we have left and when it\'ll reset',
        examples: [
          COMMAND_NAME,
        ],
        type: CommandTypes.OWNER,
        usage: '',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {
    const { session_start_limit: sessionStartLimit } = await context.rest.fetchGatewayBot();

    const timestamp = createTimestampMomentFromGuild(Date.now() + sessionStartLimit.reset_after, context.guildId);
    return editOrReply(context, [
      `We have ${sessionStartLimit.remaining.toLocaleString()} identifies left out of ${sessionStartLimit.total.toLocaleString()}`,
      `It resets ${timestamp.fromNow()} @ ${timestamp.format(DateMomentLogFormat)}`,
    ].join('\n'));
  }
}
