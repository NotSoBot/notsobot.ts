import { Command, CommandClient } from 'detritus-client';

import { imageLegofy } from '../../api';
import { CommandTypes, ImageLegofyPalettes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  dither: boolean,
  palette?: ImageLegofyPalettes,
  url?: null | string,
}

export interface CommandArgs {
  dither: boolean,
  palette?: ImageLegofyPalettes,
  url: string,
}

export const COMMAND_NAME = 'legofy';

export default class LegofyCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['lego'],
      args: [
        {name: 'dither', type: Boolean},
        {name: 'palette', choices: Object.values(ImageLegofyPalettes), help: `Must be one of: (${Object.values(ImageLegofyPalettes).join(', ')})`},
      ],
      metadata: {
        description: 'Legofy an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -palette mono`,
          `${COMMAND_NAME} notsobot -dither`,
        ],
        type: CommandTypes.IMAGE,
        usage: `${COMMAND_NAME} ?<emoji,user:id|mention|name,url> (-dither) (-palette <ImageLegofyPalettes>)`,
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageLegofy(context, args);
    return imageReply(context, response);
  }
}
