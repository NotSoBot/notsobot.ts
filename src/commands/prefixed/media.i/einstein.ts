import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'einstein';

export default class EinsteinCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ein', 'stein'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make Einstein write some text on a chalkboard (up to 15 characters)',
        examples: [
          `${COMMAND_NAME} e=mc2`,
        ],
        id: Formatter.Commands.MediaICreateEinstein.COMMAND_ID,
        usage: '<text>',
      },
      type: Parameters.string({maxLength: Formatter.Commands.MediaICreateEinstein.MAX_TEXT_LENGTH}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateEinstein.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateEinstein.CommandArgs) {
    return Formatter.Commands.MediaICreateEinstein.createMessage(context, args);
  }
}
