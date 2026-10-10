import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'upload-commands';

export default class UploadCommandsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Upload the bot\'s command information to the website',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerUploadCommands.COMMAND_ID,
        usage: '',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {
    return Formatter.Commands.OwnerUploadCommands.createMessage(context);
  }
}
