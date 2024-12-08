import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'zoom';

export default class ZoomCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Zoom into an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 2`,
        ],
        id: Formatter.Commands.MediaIVManipulationZoom.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <amount,float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, image: true, video: true})},
        {name: 'amount', type: 'float', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationZoom.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationZoom.createMessage(context, args);
  }
}
