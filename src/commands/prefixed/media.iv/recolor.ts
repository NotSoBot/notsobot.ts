import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'recolor';

export default class RecolorCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Recolor an Image or Video with brighter colors',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @NotSoBot`,
        ],
        id: Formatter.Commands.MediaIVManipulationRecolor.COMMAND_ID,
        usage: '<emoji,user:id|mention,url>',
      },
    });
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationRecolor.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRecolor.createMessage(context, args);
  }
}
