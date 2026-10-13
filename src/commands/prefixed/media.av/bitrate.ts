import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'bitrate';

export default class BitRateCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Set an Audio or Video File\'s Bit Rate',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 1000 1000`,
        ],
        id: Formatter.Commands.MediaAVManipulationSetBitRate.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <video:number> <audio:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'video', type: Number},
        {name: 'audio', type: Number},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaAVManipulationSetBitRate.CommandArgs) {
    return args.audio !== undefined || args.video !== undefined;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationSetBitRate.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationSetBitRate.createMessage(context, args);
  }
}
