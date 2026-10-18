import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ai memory';

export default class AIMemoryCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ai memories'],
      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'See what NotSoAI remembers about you.',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.SettingsAIMemoryList.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsAIMemoryList.CommandArgs) {
    return Formatter.Commands.SettingsAIMemoryList.createMessage(context, args);
  }
}
