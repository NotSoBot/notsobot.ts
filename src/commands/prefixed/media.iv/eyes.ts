import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaEyeTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'eyes';

export default class EyesCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['eye'],
      args: [
        {name: 'flipped', aliases: ['flip'], type: Boolean},
        // case insensitive, the choices are uppercase so the documented `-type spongebob` always failed
        {name: 'type', type: Parameters.oneOf({choices: MediaEyeTypes})},
      ],
      metadata: {
        description: 'Attach eyes to people\'s faces in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png -type spongebob`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png -type googly -flipped`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationEyes.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-type <choice>) (-flipped)',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEyes.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyes.createMessage(context, args);
  }
}
