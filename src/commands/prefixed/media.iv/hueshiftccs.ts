import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'hueshiftccs';

export default class HueShiftCCSCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ccs'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Rotate an Image or Video\'s Hue and change its Saturation, Gamma, Gain, and Offset like Vegas\'s Color Corrector (Secondary)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot 180`,
          `${COMMAND_NAME} notsobot 90 1.5 0.8 1.2 -16`,
        ],
        id: Formatter.Commands.MediaIVManipulationHueShiftCCS.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<rotate hue:number> ?<saturation:float> ?<gamma:float> ?<gain:float> ?<offset:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'hue'},
        {name: 'saturation'},
        {name: 'gamma'},
        {name: 'gain'},
        {name: 'offset', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHueShiftCCS.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShiftCCS.createMessage(context, args);
  }
}
