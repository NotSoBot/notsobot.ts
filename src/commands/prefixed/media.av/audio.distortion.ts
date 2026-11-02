import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio distortion';

export default class AudioDistortionCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a distortion', 'audio distort', 'a distort'],
      args: [
        {name: 'drive', aliases: ['d'], type: 'float', metadata: {description: '0 to 100'}},
        {name: 'mix', aliases: ['m'], type: 'float', metadata: {description: '0 to 1'}},
        {name: 'lowpass', aliases: ['lp'], type: Number, metadata: {description: '0 to 20000'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Distort an Audio or Video\'s audio, pushing it into clipping',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -drive 100 -lowpass 3000`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioDistortion.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-drive <float>) (-mix <float>) (-lowpass <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioDistortion.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioDistortion.createMessage(context, args);
  }
}
