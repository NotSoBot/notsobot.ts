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
        {name: 'depth', aliases: ['d'], metadata: {description: 'Depth of Modulation (Default: 0.5)'}},
        {name: 'frequency', aliases: ['f'], metadata: {description: 'Modulation Frequency (Default: 5.0)'}},
      ],
      metadata: {
      category: CommandCategories.TOOLS,
      description: 'Manipulate an audio or video file\'s pitch',
      examples: [
        `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
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
