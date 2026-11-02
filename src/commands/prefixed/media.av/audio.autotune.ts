import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio autotune';

export default class AudioAutotuneCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a autotune', 'autotune'],
      args: [
        {name: 'key', aliases: ['k'], metadata: {description: 'C, F#, Am, Bb minor or chromatic'}},
        {name: 'strength', aliases: ['s'], type: 'float', metadata: {description: '0 to 1'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Autotune the voice in an Audio or Video onto the notes of a key',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -key F#m -strength 0.7`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioAutotune.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-key <text>) (-strength <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioAutotune.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioAutotune.createMessage(context, args);
  }
}
