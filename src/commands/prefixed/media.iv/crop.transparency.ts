import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideosCommand } from '../basecommand';


export const COMMAND_NAME = 'crop transparency';

export default class CropTransparencyCommand extends BaseImageOrVideosCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['croptransparency', 'crop shape'],

      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Cut an Image or Video to the shape of a second image\'s transparency (an emoji, a logo, a cutout)',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/photo.jpg 🍕`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 ⭐`,
        ],
        id: Formatter.Commands.MediaIVManipulationCropTransparency.COMMAND_ID,
        usage: '<emoji,user:id|mention|name,url> <emoji,user:id|mention|name,url>',
      },
      maxAmount: 2,
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCropTransparency.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCropTransparency.createMessage(context, args);
  }
}
