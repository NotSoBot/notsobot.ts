import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'zoomblur';

export default class ZoomBlurCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amount', type: 'float'},
        {aliases: ['e'], name: 'expand', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply a Zoom Blur to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -expand`,
        ],
        id: Formatter.Commands.MediaIVManipulationZoomBlur.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <float>) (-expand)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationZoomBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationZoomBlur.createMessage(context, args);
  }
}
