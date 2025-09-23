import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaEdgeDetectMethods } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'edgedetect';

export default class EdgeDetectCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['i'], name: 'invert', type: Boolean},
        {aliases: ['m'], name: 'method', type: Parameters.oneOf({choices: MediaEdgeDetectMethods})},
        {aliases: ['mi'], name: 'mix', type: Number},
        {aliases: ['s'], name: 'strength', type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Extract and compose Image/Video edges using 8-directional Sobel edge detection',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationEdgeDetect.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-invert) (-method <MediaEmbossMethods>) (-mix <number>) (-strength <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEdgeDetect.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEdgeDetect.createMessage(context, args);
  }
}
