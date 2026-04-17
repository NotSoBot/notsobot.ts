import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaResizeKernels } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'resize';

export default class ResizeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['enlarge', 'rescale'],
      args: [
        {name: 'kernel', aliases: ['k'], type: Parameters.oneOf({choices: MediaResizeKernels})},
        {name: 'ratio', aliases: ['r'], type: Boolean},
        {name: 'scale', aliases: ['sc'], type: 'float'},
        {name: 'size', aliases: ['sz']},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Resize an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -kernel bicubic`,
          `${COMMAND_NAME} 👌🏿 -scale 2`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png -size 2048`,
          `${COMMAND_NAME} https://apng.onevcat.com/assets/elephant.png -ratio -size 320x320`,
        ],
        id: Formatter.Commands.MediaIVToolsResize.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <SizeOrScale:Size,float> (-kernel <MediaResizeKernels>) (-ratio)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, image: true, video: true})},
        {name: 'sizeorscale', default: 2, type: Parameters.sizeOrScale, consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsResize.CommandArgs) {
    return Formatter.Commands.MediaIVToolsResize.createMessage(context, args);
  }
}
