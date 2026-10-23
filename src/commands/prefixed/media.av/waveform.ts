import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'waveform';

export default class WaveformCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'color', aliases: ['c']},
        {name: 'split', aliases: ['s'], type: Boolean, metadata: {description: 'Draw each channel separately'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Draw the audio of an Audio or Video file as a waveform image',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 -color red -split`,
        ],
        id: Formatter.Commands.MediaAVManipulationWaveform.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-color <string:FFMPEGColors|HEX|RGBA?>) (-split)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationWaveform.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationWaveform.createMessage(context, args);
  }
}
