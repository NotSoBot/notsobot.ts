import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio put replace';

export default class AudioPutReplaceCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a put replace'],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Replace an image/video\'s audio with another audio file',
        examples: [
          `${COMMAND_NAME} https://cdn.discordapp.com/attachments/621077547471601689/1082590399459241994/tiktok_en_us_female_01-3acb462e5617fa65b7914ef2ae049cd8.mp3 @cake#0001`,
        ],
        id: Formatter.Commands.AudioToolsPutReplace.COMMAND_ID,
        usage: '?<url> ?<emoji,user:id|mention|name,url>',
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

  async run(context: Command.Context, args: Formatter.Commands.AudioToolsPutReplace.CommandArgs) {
    return Formatter.Commands.AudioToolsPutReplace.createMessage(context, args);
  }
}
