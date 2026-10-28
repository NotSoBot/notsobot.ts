import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio reverb';

export default class AudioReverbCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
  
      aliases: ['a reverb'],
      args: [
        {name: 'decay', aliases: ['dc'], metadata: {description: 'Reverb Decay (0.001 to 1, default: 0.88)'}},
        {name: 'delay', aliases: ['dl'], metadata: {description: 'Reverb Delay (1 to 20000, default: 60ms)'}},
        {name: 'volume', aliases: ['v'], metadata: {description: 'Reverb Volume (0 to 1000, default: 0.4)'}},
      ],
      metadata: {
      category: CommandCategories.AUDIO,
      description: 'Add an Audio Reverb to an Audio or Video file',
      examples: [
        `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3`,
      ],
      id: Formatter.Commands.MediaAVManipulationAudioReverb.COMMAND_ID,
      usage: '?<emoji,user:id|mention|name,url> (-decay <float>) (-delay <number>) (-volume <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioReverb.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioReverb.createMessage(context, args);
  }
}
