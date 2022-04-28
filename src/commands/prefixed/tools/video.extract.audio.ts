import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'video extract audio';

export default class VideoExtractAudioCommand extends BaseAudioOrVideoCommand<Formatter.Commands.VideoExtractAudio.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['v extract audio', 'v e audio'],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Extract audio from a video',
        examples: [
          `${COMMAND_NAME} https://cdn.discordapp.com/attachments/560593330270896129/966626275852681216/TerryResonance.webm`,
        ],
        id: Formatter.Commands.VideoExtractAudio.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.VideoExtractAudio.CommandArgs) {
    return Formatter.Commands.VideoExtractAudio.createMessage(context, args);
  }
}
