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
        {name: 'depth', aliases: ['d'], metadata: {description: 'Depth of Modulation (0 to 1, default: 0.5)'}},
        {name: 'frequency', aliases: ['f'], metadata: {description: 'Modulation Frequency (0.1 to 20000, default: 5.0)'}},
      ],
      metadata: {
      category: CommandCategories.AUDIO,
      description: 'Make an Audio or Video\'s volume pulse up and down (tremolo)',
      examples: [
        `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3`,
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
