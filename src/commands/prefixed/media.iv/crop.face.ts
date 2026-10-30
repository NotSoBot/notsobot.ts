import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'crop face';

export default class CropFaceCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'zoom', aliases: ['z'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Crop an Image or Video to a face, following it on every frame (the face number is the one drawfaces shows)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 1`,
          `${COMMAND_NAME} -zoom`,
        ],
        id: Formatter.Commands.MediaIVManipulationCropFace.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<face:number> (-zoom)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'face', type: (value: string) => (value) ? Number(value) : undefined},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCropFace.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCropFace.createMessage(context, args);
  }
}
