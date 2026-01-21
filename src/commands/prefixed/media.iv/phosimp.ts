import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'phosimp';

export default class PhoSimpCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply PhoSimp Filters on an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot 1 9 4`,
        ],
        id: Formatter.Commands.MediaIVManipulationPhoSimp.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <...PhoSimpFilters>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'filters', type: Parameters.phosimpFilters, consume: true}, // add a custom type here
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPhoSimp.CommandArgs) {
    return !!args.filters.length && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPhoSimp.CommandArgs) {
    if (!args.filters.length) {
      return BaseCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPhoSimp.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPhoSimp.createMessage(context, args);
  }
}
