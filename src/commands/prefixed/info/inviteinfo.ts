import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'inviteinfo';

export default class InviteInfoCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'code',
      metadata: {
        description: 'Get information of a discord invite',
        examples: [
          `${COMMAND_NAME} 9Ukuw9V`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoInvite.COMMAND_ID,
        usage: '<code>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoInvite.CommandArgsBefore) {
    return !!args.code;
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoInvite.CommandArgs) {
    return Formatter.Commands.InfoInvite.createMessage(context, args);
  }
}
