import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio tremolo';

export default class AudioTremoloCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
  
      aliases: ['a tremolo'],
      args: [
        {name: 'depth', aliases: ['d'], metadata: {description: 'Depth of Modulation (Default: 0.5)'}},
        {name: 'frequency', aliases: ['f'], metadata: {description: 'Modulation Frequency (Default: 5.0)'}},
      ],
      metadata: {
      category: CommandCategories.TOOLS,
      description: 'Modify the audio\'s wave pattern in an Audio or Video file',
      examples: [
        `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
      ],
      id: Formatter.Commands.MediaAVManipulationAudioTremolo.COMMAND_ID,
      usage: '?<emoji,user:id|mention|name,url> (-depth <float>) (-frequency <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioTremolo.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioTremolo.createMessage(context, args);
  }
}
