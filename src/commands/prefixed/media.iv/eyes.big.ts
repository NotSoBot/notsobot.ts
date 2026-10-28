import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'eyes big';

export default class EyesCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'big',
      prefixes: ['eyes ', 'eye '],

      args: [
        {name: 'flipped', aliases: ['flip'], type: Boolean},
      ],
      metadata: {
        description: 'Attach big eyes to people\'s faces in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationEyesBig.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-flipped)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEyesBig.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesBig.createMessage(context, args);
  }
}
