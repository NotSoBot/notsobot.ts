import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'woodensign';

export default class WoodenSignCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['sign'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Carve text into a wooden sign',
        examples: [
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaICreateWoodenSign.COMMAND_ID,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateWoodenSign.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateWoodenSign.CommandArgs) {
    return Formatter.Commands.MediaICreateWoodenSign.createMessage(context, args);
  }
}
