import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'voice delete';

export default class VoiceDeleteCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'voice',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Delete one of your stored cloned voices',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.VoiceDelete.COMMAND_ID,
        premium: true,
        usage: '<voice:string>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.VoiceDelete.CommandArgs) {
    return !!args.voice;
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceDelete.CommandArgs) {
    return Formatter.Commands.VoiceDelete.createMessage(context, args);
  }
}
