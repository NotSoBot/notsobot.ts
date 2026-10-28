import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'vocoder';

export default class AudioVocoderCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['vocode', 'audio vocoder', 'a vocoder'],
      args: [
        {name: 'bands', aliases: ['b'], type: Number, metadata: {description: '1 to 512'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Make the voice in the first Audio or Video sing the second one\'s music (the "autotune" vocoder from tags)',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/video/file.mp4 https://notsobot.com/some/audio/song.mp3`,
          `${COMMAND_NAME} https://notsobot.com/some/audio/song.mp3 -bands 16`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioVocoder.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-bands <number>)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioVocoder.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioVocoder.createMessage(context, args);
  }
}
