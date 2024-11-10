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
        {aliases: ['a'], name: 'amount', type: Number},
        {aliases: ['d'], name: 'direction', type: Parameters.oneOf({choices: MediaWiggleDirections})},
        {aliases: ['w'], name: 'wavelengths', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Wiggle an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -direction down`,
        ],
        id: Formatter.Commands.MediaIVManipulationWiggle.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <number>) (-direction <MediaWiggleDirections>) (-wavelengths <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationWiggle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWiggle.createMessage(context, args);
  }
}
