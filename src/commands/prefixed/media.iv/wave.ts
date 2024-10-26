import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'wave';

export default class WaveCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amplitude', type: Number},
        {aliases: ['l'], name: 'length', label: 'waveLength', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Distort an Image or Video with a sine wave function',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -amplitude 10 -length 64`,
        ],
        id: Formatter.Commands.MediaIVManipulationWave.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amplitude <number>) (-length <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationWave.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWave.createMessage(context, args);
  }
}
