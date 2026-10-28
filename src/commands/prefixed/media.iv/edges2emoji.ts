import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'edges2emoji';

export default class Edges2EmojiCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['e2e'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Trace an Image or Video\'s edges and have an AI redraw them as an emoji',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationEdges2Emoji.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEdges2Emoji.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEdges2Emoji.createMessage(context, args);
  }
}
