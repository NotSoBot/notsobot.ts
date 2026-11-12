import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaEyeTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'eyes laser';

// typed as the plain color, `-color red`
const COLORS: Record<string, MediaEyeTypes> = {
  blue: MediaEyeTypes.LASER_BLUE,
  green: MediaEyeTypes.LASER_GREEN,
  red: MediaEyeTypes.LASER_RED,
  yellow: MediaEyeTypes.LASER_YELLOW,
};

export default class EyesLaserCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'laser',
      prefixes: ['eyes ', 'eye '],

      args: [
        {
          name: 'color',
          aliases: ['c'],
          type: Parameters.oneOf({
            choices: COLORS,
            descriptions: Object.fromEntries(Object.entries(COLORS).map(([color, type]) => [type, color])),
          }),
          metadata: {description: 'blue, green, red or yellow (yellow by default)'},
        },
      ],
      metadata: {
        description: 'Shoot laser beams out of people\'s eyes in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png -color red`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationEyesLaser.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-color <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEyesLaser.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesLaser.createMessage(context, args);
  }
}
