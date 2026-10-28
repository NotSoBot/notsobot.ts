import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'eyes black';

export default class EyesCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'black',
      prefixes: ['eyes ', 'eye '],

      args: [
        {name: 'flipped', aliases: ['flip'], type: Boolean},
      ],
      metadata: {
        description: 'Attach black eyes to people\'s faces in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationEyesBlack.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-flipped)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEyesBlack.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesBlack.createMessage(context, args);
  }
}
