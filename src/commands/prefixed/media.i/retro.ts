import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'retro';

export default class RetroCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'type', label: 'background'},
      ],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Write text in an 80s retrowave style',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} line1 | line2 | line3 -type 2`,
        ],
        id: Formatter.Commands.MediaICreateRetrowave.COMMAND_ID,
        usage: '?<text> (-type <retro-type>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateRetrowave.CommandArgs) {
    return Formatter.Commands.MediaICreateRetrowave.createMessage(context, args);
  }
}
