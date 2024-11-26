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
        category: CommandCategories.TOOLS,
        description: 'Extract audio from a video',
        examples: [
          `${COMMAND_NAME} https://cdn.discordapp.com/attachments/560593330270896129/966626275852681216/TerryResonance.webm`,
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
