import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'crop';

export default class CropCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Crop an Image or Video',
        examples: [
          `${COMMAND_NAME} 100 100 0 0`,
          `${COMMAND_NAME} notsobot 100 100 0 0`,
        ],
        id: Formatter.Commands.MediaIVToolsCrop.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <width,expression> <height,expression> ?<x,expression> ?<y,expression>',
      },
      priority: -1,
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, video: false})},
        {name: 'width'},
        {name: 'height'},
        {name: 'x'},
        {name: 'y'},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVToolsCrop.CommandArgs) {
    return !!args.width && !!args.height && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.MediaIVToolsCrop.CommandArgs) {
    if (!args.width || !args.height) {
      return BaseImageOrVideoCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsCrop.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCrop.createMessage(context, args);
  }
}
