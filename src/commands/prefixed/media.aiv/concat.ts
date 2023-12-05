import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'concat';

export default class ConcatCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Concat two Medias together',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 @cake#0001`,
        ],
        id: Formatter.Commands.MediaAIVToolsConcat.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url>',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVToolsConcat.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsConcat.createMessage(context, args);
  }
}
