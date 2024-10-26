import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'waves';

export default class WavesCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amplitude', type: Number},
        {aliases: ['l'], name: 'length', label: 'waveLength', type: Number},
        {aliases: ['s'], name: 'speed', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Distort an Image or Video with a sine wave function that moves',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -amplitude 10 -length 64`,
        ],
        id: Formatter.Commands.MediaIVManipulationWaveAnimated.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amplitude <number>) (-length <number>) (-speed <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationWaveAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWaveAnimated.createMessage(context, args);
  }
}
