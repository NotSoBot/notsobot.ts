import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaPixelSortFunctions, MediaPixelSortIntervals } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'pixelsort';

export default class PixelSortCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['sort'],
      args: [
        {aliases: ['i'], name: 'interval', type: Parameters.oneOf({choices: MediaPixelSortIntervals})},
        {aliases: ['sb'], name: 'sort', type: Parameters.oneOf({choices: MediaPixelSortFunctions})},
        {aliases: ['a'], name: 'angle', type: Number},
        {name: 'lower', type: 'float'},
        {name: 'upper', type: 'float'},
        {aliases: ['l'], name: 'length', type: Number},
        {aliases: ['r'], name: 'randomness', type: Number},
        {name: 'reverse', type: Boolean},
        {aliases: ['s'], name: 'seed', type: Number},
      ],
      metadata: {
        description: 'Sort runs of pixels in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -interval RANDOM`,
          `${COMMAND_NAME} notsobot -sort HUE`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationPixelSort.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-interval <type>) (-sort <type>) (-angle <number>) (-lower <float>) (-upper <float>) (-length <number>) (-randomness <number>) (-reverse) (-seed <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPixelSort.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPixelSort.createMessage(context, args);
  }
}
