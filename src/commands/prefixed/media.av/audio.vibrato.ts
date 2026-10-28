import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio vibrato';

export default class AudioVibratoCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
  
      aliases: ['a vibrato'],
      args: [
        {name: 'depth', aliases: ['d'], metadata: {description: 'Depth of Modulation (0 to 1, default: 0.5)'}},
        {name: 'frequency', aliases: ['f'], metadata: {description: 'Modulation Frequency (0.1 to 20000, default: 5.0)'}},
      ],
      metadata: {
      category: CommandCategories.AUDIO,
      description: 'Make an Audio or Video\'s pitch waver up and down (vibrato)',
      examples: [
        `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3`,
      ],
      id: Formatter.Commands.MediaAVManipulationAudioVibrato.COMMAND_ID,
      usage: '?<emoji,user:id|mention|name,url> (-depth <float>) (-frequency <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioVibrato.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioVibrato.createMessage(context, args);
  }
}
