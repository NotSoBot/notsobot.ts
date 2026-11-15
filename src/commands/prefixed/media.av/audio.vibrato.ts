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
        {name: 'frequency', aliases: ['f'], metadata: {description: 'Modulation Frequency (0.1 to 20000, 0.001 to 1000 with a curve, default: 5.0)'}},
        {name: 'semitones', aliases: ['s'], metadata: {description: 'Draws the pitch from a curve instead: semitones a depth of 1 is (-24 to 24, default: 12)'}},
        {name: 'points', aliases: ['p'], metadata: {description: 'The curve, phase (0 to 1),depth (-1 to 1) pairs split by spaces (default: 0,0 0.25,1 0.75,-1 1,0)'}},
        {name: 'blend', aliases: ['b'], type: Boolean, metadata: {description: 'Fade over the skip back at the start of each cycle of the curve'}},
      ],
      metadata: {
      category: CommandCategories.AUDIO,
      description: 'Make an Audio or Video\'s pitch waver up and down (vibrato)',
      examples: [
        `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3`,
        `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -semitones 2`,
        `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -semitones 24 -points 0,0 1,1 -frequency 3.3`,
        `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -semitones 12 -points 0,-1 0.5,1 1,-1 -frequency 2 -blend`,
      ],
      id: Formatter.Commands.MediaAVManipulationAudioVibrato.COMMAND_ID,
      usage: '?<emoji,user:id|mention|name,url> (-depth <float>) (-frequency <float>) (-semitones <float>) (-points <phase,depth ...>) (-blend)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioVibrato.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioVibrato.createMessage(context, args);
  }
}
