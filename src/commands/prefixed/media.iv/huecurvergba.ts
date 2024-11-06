import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'huecurvergba';

export default class HueCurveRGBACommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      
      args: [
        {name: 'all', type: Parameters.hueCurveCoordinates},
        {name: 'alpha', aliases: ['a'], type: Parameters.hueCurveCoordinates},
        {name: 'blue', aliases: ['b'], type: Parameters.hueCurveCoordinates},
        {name: 'green', aliases: ['g'], type: Parameters.hueCurveCoordinates},
        {name: 'red', aliases: ['r'], type: Parameters.hueCurveCoordinates},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply RGB/A curve adjustments to an Image or Video\'s channels',
        examples: [
        COMMAND_NAME,
          `${COMMAND_NAME} notsobot -red 0,1 1,1`,
          `${COMMAND_NAME} notsobot -red 0,1 1,1 -green (0, 0.5) (0, 1)`,
          `${COMMAND_NAME} notsobot -all 0 1 0`,
        ],
        id: Formatter.Commands.MediaIVManipulationHueCurveRGBA.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-all <HueCurveCoordinates>) (-red <HueCurveCoordinates>) (-green <HueCurveCoordinates>) (-blue <HueCurveCoordinates>) (-alpha <HueCurveCoordinates>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHueCurveRGBA.CommandArgs) {
    return !!(args.all || args.red || args.green || args.blue || args.alpha);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHueCurveRGBA.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueCurveRGBA.createMessage(context, args);
  }
}
