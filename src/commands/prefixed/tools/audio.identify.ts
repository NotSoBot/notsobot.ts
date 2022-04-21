import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio identify';

export default class AudioIdentifyCommand extends BaseAudioOrVideoCommand<Formatter.Commands.AudioIdentify.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a identify'],
      metadata: {
        description: 'Identify a song in an audio or video file',
        examples: [
          `${COMMAND_NAME} https://cdn.discordapp.com/attachments/560593330270896129/966626275852681216/TerryResonance.webm`,
        ],
        type: CommandTypes.TOOLS,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.AudioIdentify.CommandArgs) {
    return Formatter.Commands.AudioIdentify.createMessage(context, args);
  }
}
