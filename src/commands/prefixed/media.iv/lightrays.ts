import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'lightrays';

export default class LightRaysCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['se'], name: 'sensitivity', type: 'float', metadata: {description: 'share of the brightness that makes rays, 0 to 1'}},
        {aliases: ['st'], name: 'strength', type: 'float', metadata: {description: 'length and brightness of the rays, 0 to 2'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Streak the bright parts of an Image or Video out into rays, like VEGAS\' Light Rays',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot -strength 2`,
          `${COMMAND_NAME} notsobot -sensitivity 1 -strength 0.5`,
        ],
        id: Formatter.Commands.MediaIVManipulationLightRays.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-sensitivity <float>) (-strength <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationLightRays.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLightRays.createMessage(context, args);
  }
}
