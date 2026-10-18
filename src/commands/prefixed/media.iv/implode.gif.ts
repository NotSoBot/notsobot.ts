import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'implode gif';

export default class ImplodeAnimatedCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['gimplode'],
      args: [
        {aliases: ['s'], name: 'scale', type: 'float', metadata: {description: '0 to 100'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Apply a gradually increasing Implode effect to a Single-framed Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -scale 5`,
        ],
        id: Formatter.Commands.MediaIVManipulationImplodeAnimated.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-scale <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationImplodeAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationImplodeAnimated.createMessage(context, args);
  }
}
