import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'audio put replace';

export default class AudioPutReplaceCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a put replace'],
      args: [
        {name: 'longest', type: Boolean},
        {name: 'noloop', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Replace an Audio/Image/Video\'s audio with another audio file',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 @cake#0001`,
        ],
        id: Formatter.Commands.MediaAToolsPutReplace.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-longest) (-noloop)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAToolsPutReplace.CommandArgs) {
    return Formatter.Commands.MediaAToolsPutReplace.createMessage(context, args);
  }
}
