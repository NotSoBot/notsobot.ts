import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set ai personality';

export default class SetAIPersonalityCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'clear', aliases: ['c'], type: Boolean},
      ],
      disableDm: true,
      label: 'personality',
      metadata: {
        category: CommandCategories.SETTINGS,
        description: 'Set the guild\'s AI personality.',
        examples: [
          `${COMMAND_NAME} Be very cutesy and dumb`,
        ],
        id: Formatter.Commands.SettingsServerSetAIPersonality.COMMAND_ID,
        usage: '<personality-description> (-clear)',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsServerSetAIPersonality.CommandArgs) {
    return Formatter.Commands.SettingsServerSetAIPersonality.createMessage(context, args);
  }
}
