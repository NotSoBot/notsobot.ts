import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'deepfry';

export default class DeepfryCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['nt'], name: 'notransparency', type: Boolean},
        {aliases: ['s'], name: 'scale', type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Deep fry an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -scale 5`,
        ],
        id: Formatter.Commands.MediaIVManipulationDeepfry.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-notransparency) (-scale <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDeepfry.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDeepfry.createMessage(context, args);
  }
}
