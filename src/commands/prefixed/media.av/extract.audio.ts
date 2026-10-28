import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'extract audio';

export default class ExtractAudioCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ex audio'],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Extract Audio from an Audio or Video File',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4`,
        ],
        id: Formatter.Commands.MediaAVToolsExtractAudio.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVToolsExtractAudio.CommandArgs) {
    return Formatter.Commands.MediaAVToolsExtractAudio.createMessage(context, args);
  }
}
