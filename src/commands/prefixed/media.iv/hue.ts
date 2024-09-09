import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'hue';

export default class HueCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Shift the Image or Video\'s Pixel Color by X amount',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 90`,
        ],
        id: Formatter.Commands.MediaIVManipulationHueShift.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<red:number> ?<green:number> ?<blue:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'red'},
        {name: 'green'},
        {name: 'blue', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHueShift.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShift.createMessage(context, args);
  }
}
