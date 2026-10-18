import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'tvsimulator';

export default class TVSimulatorCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tvsim'],
      args: [
        {aliases: ['dz'], label: 'detailZoom', name: 'detailzoom', type: 'float', metadata: {description: '1 to 8'}},
        {aliases: ['ls'], label: 'lineSync', name: 'linesync', type: 'float', metadata: {description: '0 to 1'}},
        {name: 'vertical', aliases: ['v'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make an Image or Video look like an analog TV losing line sync (1 is clean and lower tears more, a higher detail zoom gives bigger waves, vertical tears up and down)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -linesync 0.2 -detailzoom 3`,
          `${COMMAND_NAME} notsobot -linesync 0.2 -vertical`,
        ],
        id: Formatter.Commands.MediaIVManipulationTVSimulator.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-detailzoom <float>) (-linesync <float>) (-vertical)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationTVSimulator.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTVSimulator.createMessage(context, args);
  }
}
