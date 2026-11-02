import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio wahwah';

export default class AudioWahWahCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a wahwah', 'audio wah', 'a wah'],
      args: [
        {name: 'rate', aliases: ['r'], type: 'float', metadata: {description: '0.1 to 10'}},
        {name: 'depth', aliases: ['d'], type: 'float', metadata: {description: '0 to 100'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Add a wah-wah to an Audio or Video, a band of the sound sweeping up and down',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -rate 4 -depth 100`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioWahWah.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-rate <float>) (-depth <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioWahWah.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioWahWah.createMessage(context, args);
  }
}
