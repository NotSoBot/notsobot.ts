import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'anime';

export default class AnimeCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
  
      metadata: {
        description: 'Animeify an Image\'s face',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIManipulationFaceAnime.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIManipulationFaceAnime.CommandArgs) {
    return Formatter.Commands.MediaIManipulationFaceAnime.createMessage(context, args);
  }
}
