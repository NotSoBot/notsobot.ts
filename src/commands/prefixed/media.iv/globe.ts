import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'globe';

export default class GlobeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'tiled', aliases: ['t'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Create a Globe out of an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -tiled`,
        ],
        id: Formatter.Commands.MediaIVManipulationGlobe.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-tiled)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationGlobe.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlobe.createMessage(context, args);
  }
}
