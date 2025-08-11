import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set my ai personality';

export default class SetMyAIPersonalityCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'personality',
      metadata: {
        category: CommandCategories.SETTINGS,
        description: 'Set the your AI personality.',
        examples: [
          `${COMMAND_NAME} Be very cutesy and dumb`,
        ],
        id: Formatter.Commands.SettingsSetAIPersonality.COMMAND_ID,
        usage: '<personality-description>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsSetAIPersonality.CommandArgs) {
    return Formatter.Commands.SettingsSetAIPersonality.createMessage(context, args);
  }
}
