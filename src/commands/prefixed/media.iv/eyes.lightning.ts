import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaEyeTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'eyes lightning';

// typed as the plain color, `-color red`
const COLORS: Record<string, MediaEyeTypes> = {
  blue: MediaEyeTypes.LIGHTNING_BLUE,
  green: MediaEyeTypes.LIGHTNING_GREEN,
  pink: MediaEyeTypes.LIGHTNING_PINK,
  red: MediaEyeTypes.LIGHTNING_RED,
};

export default class EyesLightningCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'lightning',
      prefixes: ['eyes ', 'eye '],

      args: [
        {
          name: 'color',
          aliases: ['c'],
          type: Parameters.oneOf({
            choices: COLORS,
            descriptions: Object.fromEntries(Object.entries(COLORS).map(([color, type]) => [type, color])),
          }),
          metadata: {description: 'blue, green, pink or red (pink by default)'},
        },
      ],
      metadata: {
        description: 'Make people\'s eyes glow and crackle with lightning in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png -color blue`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationEyesLightning.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-color <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEyesLightning.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesLightning.createMessage(context, args);
  }
}
