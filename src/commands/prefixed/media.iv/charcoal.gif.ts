import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'charcoal gif';

export default class CharcoalAnimatedCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['gcharcoal'],
      args: [
        {aliases: ['r'], name: 'radius', type: Number, metadata: {description: '2 to 10'}},
      ],
      metadata: {
        description: 'Apply a gradually increasing Charcoal effect to a Single-framed Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -radius 10`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationCharcoalAnimated.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-radius <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCharcoalAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCharcoalAnimated.createMessage(context, args);
  }
}
