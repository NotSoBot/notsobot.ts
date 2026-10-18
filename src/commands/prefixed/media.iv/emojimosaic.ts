import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'emojimosaic';

export default class EmojiMosaicCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      // the old bot's `emojimosaic2` took the size as `scale`
      aliases: ['e2m', 'emojim', 'emojimosaic2', 'e2m2', 'fe2m'],
      args: [
        {name: 'size', aliases: ['scale', 's'], type: Number},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Rebuild an Image or Video out of emojis, the size is how many emojis wide/tall it is (2-100, defaults to one per 16 pixels)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -size 32`,
        ],
        id: Formatter.Commands.MediaIVManipulationEmojiMosaic.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-size <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEmojiMosaic.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEmojiMosaic.createMessage(context, args);
  }
}
