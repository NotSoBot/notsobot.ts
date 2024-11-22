import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'audio put mix';

export default class AudioPutMixCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a put mix'],
      args: [
        {name: 'longest', aliases: ['l'], type: Boolean},
        {name: 'noloop', aliases: ['nl'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Mix an Audio/Image/Video\'s audio with another audio file',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 @cake#0001`,
        ],
        id: Formatter.Commands.MediaAToolsPutMix.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-longest) (-noloop)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAToolsPutMix.CommandArgs) {
    return Formatter.Commands.MediaAToolsPutMix.createMessage(context, args);
  }
}
