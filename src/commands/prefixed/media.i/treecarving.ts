import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'treecarving';

export default class TreeCarvingCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['carve'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Carve text into a tree',
        examples: [
          `${COMMAND_NAME} line 1 | line 2`,
        ],
        id: Formatter.Commands.MediaICreateTreeCarving.COMMAND_ID,
        usage: '<text> (| <text 2>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateTreeCarving.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateTreeCarving.CommandArgs) {
    return Formatter.Commands.MediaICreateTreeCarving.createMessage(context, args);
  }
}
