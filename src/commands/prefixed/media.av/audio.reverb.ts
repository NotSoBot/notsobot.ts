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
        {name: 'decay', aliases: ['dc'], metadata: {description: 'Reverb Decay (Default: 0.88)'}},
        {name: 'delay', aliases: ['dl'], metadata: {description: 'Reverb Delay (Default: 60ms)'}},
        {name: 'volume', aliases: ['v'], metadata: {description: 'Reverb Volume (Default: 0.4)'}},
      ],
      metadata: {
      category: CommandCategories.TOOLS,
      description: 'Add an Audio Reverb to an Audio or Video File.',
      examples: [
        `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
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
