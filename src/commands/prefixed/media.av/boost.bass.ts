import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'boost bass';

export default class AudioBoostBassCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['b bass'],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Boost an audio/video\'s bass',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioBoostBass.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioBoostBass.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioBoostBass.createMessage(context, args);
  }
}
