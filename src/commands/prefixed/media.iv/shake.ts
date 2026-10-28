import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'shake';

export default class ShakeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['h'], name: 'horizontal', type: 'float', metadata: {description: '-10000 to 10000'}},
        {aliases: ['r'], name: 'randomize', type: Boolean},
        {aliases: ['v'], name: 'vertical', type: 'float', metadata: {description: '-10000 to 10000'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Shake an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -horizontal 5`,
          `${COMMAND_NAME} notsobot -vertical 20 -randomize`,
        ],
        id: Formatter.Commands.MediaIVManipulationShake.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-horizontal <float>) (-randomize) (-vertical <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationShake.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationShake.createMessage(context, args);
  }
}
