import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'voice list';

export default class VoiceListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.TOOLS,
        description: 'List your stored cloned voices',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.VoiceList.COMMAND_ID,
        premium: true,
        usage: '',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceList.CommandArgs) {
    return Formatter.Commands.VoiceList.createMessage(context, args);
  }
}
