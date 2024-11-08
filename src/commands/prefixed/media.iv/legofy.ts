import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaLegofyPalettes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'legofy';

export default class LegofyCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['lego'],
      args: [
        {name: 'dither', type: Boolean},
        {name: 'palette', type: Parameters.oneOf({choices: MediaLegofyPalettes})},
        {name: 'size', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Legofy an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -palette mono`,
          `${COMMAND_NAME} notsobot -dither`,
        ],
        id: Formatter.Commands.MediaIVManipulationLegofy.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-dither) (-palette <MediaLegofyPalettes>) (-size <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationLegofy.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLegofy.createMessage(context, args);
  }
}
