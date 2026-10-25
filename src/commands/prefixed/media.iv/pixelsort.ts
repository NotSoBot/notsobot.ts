import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaPixelSortFunctions, MediaPixelSortIntervals } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'pixelsort';

export default class PixelSortCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['sort', 'pxlsrt'],
      args: [
        {aliases: ['i'], name: 'interval', type: Parameters.oneOf({choices: MediaPixelSortIntervals})},
        {aliases: ['sb'], name: 'sort', type: Parameters.oneOf({choices: MediaPixelSortFunctions})},
        {aliases: ['a'], name: 'angle', type: Number, metadata: {description: '0 to 359'}},
        {name: 'lower', type: 'float', metadata: {description: '0 to 1'}},
        {name: 'upper', type: 'float', metadata: {description: '0 to 1'}},
        {aliases: ['l'], name: 'length', type: Number, metadata: {description: '2 to 1000'}},
        {aliases: ['r'], name: 'randomness', type: Number, metadata: {description: '0 to 100'}},
        {name: 'reverse', type: Boolean},
        {aliases: ['s'], name: 'seed', type: Number, metadata: {description: '0 to 2147483647'}},
      ],
      metadata: {
        description: 'Sort runs of pixels in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -interval RANDOM`,
          `${COMMAND_NAME} notsobot -sort HUE`,
          `${COMMAND_NAME} notsobot -interval IMAGE -sort COLOR`,
        ],
        category: CommandCategories.EFFECTS,
        credits: Formatter.Commands.MediaIVManipulationPixelSort.CREDITS,
        id: Formatter.Commands.MediaIVManipulationPixelSort.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-interval <choice>) (-sort <choice>) (-angle <number>) (-lower <float>) (-upper <float>) (-length <number>) (-randomness <number>) (-reverse) (-seed <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPixelSort.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPixelSort.createMessage(context, args);
  }
}
