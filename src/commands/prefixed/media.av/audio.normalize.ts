import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio normalize';

export default class AudioNormalizeCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a normalize'],
      args: [
        {name: 'strength', aliases: ['s'], metadata: {description: 'How loud it gets, 0 is -24 LUFS and 1 is -5 LUFS (0 to 1, default: 1)'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Normalize the loudness of an Audio or Video to a high volume',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/quiet.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/quiet.mp3 -strength 0.5`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioNormalize.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-strength <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioNormalize.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioNormalize.createMessage(context, args);
  }
}
