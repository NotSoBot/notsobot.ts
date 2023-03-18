import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'rip';

export default class RipCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Create a tombstone with some text',
        examples: [
          `${COMMAND_NAME} <@300505364032389122>`,
          `${COMMAND_NAME} <@300505364032389122> yup he dead`,
          `${COMMAND_NAME} yup he dead`,
        ],
        id: Formatter.Commands.ImageRip.COMMAND_ID,
        usage: '?<user:mention> ...?<text>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageRip.CommandArgs) {
    return Formatter.Commands.ImageRip.createMessage(context, args);
  }
}
