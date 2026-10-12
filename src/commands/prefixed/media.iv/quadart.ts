import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaQuadartTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'quadart';

export default class QuadartCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['t'], name: 'type', type: Parameters.oneOf({choices: MediaQuadartTypes})},
      ],
      metadata: {
        description: 'Redraw an Image or Video as a quad-tree of circles or boxes',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -type box`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationQuadart.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-type <box|circle>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationQuadart.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationQuadart.createMessage(context, args);
  }
}
