import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ai memory forget';

export default class AIMemoryForgetCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'position',
      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Make NotSoAI forget one thing it remembers about you.',
        examples: [
          `${COMMAND_NAME} 2`,
        ],
        id: Formatter.Commands.SettingsAIMemoryForget.COMMAND_ID,
        usage: '<position,number>',
      },
      type: Number,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsAIMemoryForget.CommandArgs) {
    return Formatter.Commands.SettingsAIMemoryForget.createMessage(context, args);
  }
}
