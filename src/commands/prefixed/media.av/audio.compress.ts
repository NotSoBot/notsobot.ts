import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio compress';

export default class AudioCompressCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a compress'],
      args: [
        {name: 'norevert', aliases: ['nr'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Compress Audio',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioCompress.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-norevert)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioCompress.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioCompress.createMessage(context, args);
  }
}
