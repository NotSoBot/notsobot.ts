import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaWiggleDirections } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'wiggle';

export default class WiggleCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amount', type: Number, metadata: {description: '1 to 100'}},
        {aliases: ['d'], name: 'direction', type: Parameters.oneOf({choices: MediaWiggleDirections})},
        {aliases: ['l'], name: 'loop', type: Boolean},
        {aliases: ['s'], name: 'speed', type: Number, metadata: {description: '0.25 to 10'}},
        {aliases: ['w'], name: 'wavelengths', type: Number, metadata: {description: '0 to 100'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Wiggle an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -direction down`,
          `${COMMAND_NAME} notsobot -speed 2 -loop`,
        ],
        id: Formatter.Commands.MediaIVManipulationWiggle.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <number>) (-direction <MediaWiggleDirections>) (-loop) (-speed <number>) (-wavelengths <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationWiggle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWiggle.createMessage(context, args);
  }
}
