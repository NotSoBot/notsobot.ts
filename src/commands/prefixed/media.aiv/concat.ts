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
        category: CommandCategories.CONVERSION,
        description: 'Play two Audio/Image/Video files one after the other',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 @cakedan`,
        ],
        id: Formatter.Commands.MediaAIVManipulationConcat.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url>',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationConcat.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationConcat.createMessage(context, args);
  }
}
