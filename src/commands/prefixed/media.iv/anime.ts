import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaFaceAnimeEyes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'anime';

export default class AnimeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['animeyes', 'animeeyes'],
      args: [
        {name: 'eyes', aliases: ['e'], type: Parameters.oneOf({choices: MediaFaceAnimeEyes})},
      ],
      metadata: {
        description: 'Animeify an Image or Video\'s face',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -eyes purple`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationFaceAnime.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-eyes <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceAnime.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceAnime.createMessage(context, args);
  }
}
