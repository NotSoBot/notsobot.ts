import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'volume';

export default class VolumeCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Change an audio/video\'s volume',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioVolume.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<volume,float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({image: false})},
        {name: 'volume', default: 2.0, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioVolume.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioVolume.createMessage(context, args);
  }
}
