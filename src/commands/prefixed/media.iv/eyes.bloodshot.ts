import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'eyes bloodshot';

export default class EyesCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      aliases: ['blood'],
      name: 'bloodshot',
      prefixes: ['eyes ', 'eye '],

      args: [
        {name: 'flipped', aliases: ['flip'], type: Boolean},
      ],
      metadata: {
        description: 'Attach bloodshot eyes to people\'s faces in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationEyesBloodshot.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-flipped)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEyesBloodshot.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesBloodshot.createMessage(context, args);
  }
}
