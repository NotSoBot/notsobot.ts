import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ai memory clear';

export default class AIMemoryClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Make NotSoAI forget everything it remembers about you.',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.SettingsAIMemoryClear.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsAIMemoryClear.CommandArgs) {
    return Formatter.Commands.SettingsAIMemoryClear.createMessage(context, args);
  }
}
