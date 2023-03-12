import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio put mix';

export default class AudioPutMixCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a put mix'],
      args: [
        {name: 'longest', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Mix an image/video\'s audio with another audio file',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 @cake#0001`,
        ],
        id: Formatter.Commands.MediaAToolsPutMix.COMMAND_ID,
        usage: '?<url> ?<emoji,user:id|mention|name,url> (-longest)',
      },
      type: [
        {name: 'audio', label: 'audioUrl', type: Parameters.mediaUrlPositional({image: false, video: false})},
        {name: 'url', type: Parameters.lastMediaUrl({audio: false}), consume: true},
      ],
    });
  }

  onCancelRun(context: Command.Context, args: {audioUrl?: null | string, url?: null | string}) {
    if (args.audioUrl === undefined) {
      return editOrReply(context, '⚠ Unable to find any audio in the last 50 messages.');
    } else if (args.audioUrl === null) {
      return editOrReply(context, '⚠ Unable to find that user or it was an invalid url.');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAToolsPutMix.CommandArgs) {
    return Formatter.Commands.MediaAToolsPutMix.createMessage(context, args);
  }
}
