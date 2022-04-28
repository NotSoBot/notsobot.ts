import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, ImageLegofyPalettes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'legofy';

export default class LegofyCommand extends BaseImageCommand<Formatter.Commands.ImageLegofy.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['lego'],
      args: [
        {name: 'dither', type: Boolean},
        {name: 'palette', choices: Object.values(ImageLegofyPalettes), help: `Must be one of: (${Object.values(ImageLegofyPalettes).join(', ')})`},
        {name: 'size', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Legofy an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -palette mono`,
          `${COMMAND_NAME} notsobot -dither`,
        ],
        id: Formatter.Commands.ImageLegofy.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-dither) (-palette <ImageLegofyPalettes>) (-size <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageLegofy.CommandArgs) {
    return Formatter.Commands.ImageLegofy.createMessage(context, args);
  }
}
