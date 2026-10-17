import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export const COMMAND_NAME = 'merge';

// not registered (no default export) until its formatter has an implementation, an empty command showed up in help and never replied
export class MergeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationMerge.COMMAND_ID,
      },
    });
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMerge.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMerge.createMessage(context, args);
  }
}
