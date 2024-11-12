import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'watercolor';

export default class WatercolorCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['c'], name: 'contrast', type: 'float'},
        {aliases: ['e'], name: 'edge', type: 'float'},
        {aliases: ['m'], name: 'mixing', type: Number},
        {aliases: ['s'], name: 'smoothing', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply a Watercolor Effect to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -smoothing 1`,
        ],
        id: Formatter.Commands.MediaIVManipulationWatercolor.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-contrast <float>) (-edge <float>) (-mixing <number>) (-smoothing <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationWatercolor.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWatercolor.createMessage(context, args);
  }
}
