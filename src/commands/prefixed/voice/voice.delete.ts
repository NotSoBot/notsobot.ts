import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'voice delete';

export default class VoiceDeleteCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['v delete'],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Delete your stored cloned voice',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.VoiceDelete.COMMAND_ID,
        usage: '',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceDelete.CommandArgs) {
    return Formatter.Commands.VoiceDelete.createMessage(context, args);
  }
}
