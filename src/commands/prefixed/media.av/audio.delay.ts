import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'audio delay';

export default class AudioDelayCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a delay'],
      args: [
        {name: 'nosnip', aliases: ['ns'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Delay the Audio Stream of an Audio or Video File',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 5`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioDelay.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <delay,float> (-nosnip)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: true, image: false, video: true})},
        {name: 'delay', type: 'float', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioDelay.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioDelay.createMessage(context, args);
  }
}
