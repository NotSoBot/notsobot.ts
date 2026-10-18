import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'tvsimulator';

export default class TVSimulatorCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tvsim'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make an Image or Video look like an analog TV losing line sync (1 is clean and lower tears more, a higher detail zoom gives bigger waves)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 0.2 3`,
        ],
        id: Formatter.Commands.MediaIVManipulationTVSimulator.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<line_sync:float(0..1)> ?<detail_zoom:float(1..8)>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'lineSync', type: Number},
        {name: 'detailZoom', type: Number, consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationTVSimulator.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTVSimulator.createMessage(context, args);
  }
}
