import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'audio put concat';

export default class AudioPutConcatCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a put concat'],
      args: [
        {name: 'longest', type: Boolean},
        {name: 'noloop', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Concat an Audio/Image/Video\'s audio with another audio file',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 @cake#0001`,
        ],
        id: Formatter.Commands.MediaAToolsPutConcat.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-longest) (-noloop)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAToolsPutConcat.CommandArgs) {
    return Formatter.Commands.MediaAToolsPutConcat.createMessage(context, args);
  }
}
