import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export const COMMAND_NAME = 'merge';

// not registered (no default export) until it has an implementation, the empty `run()` showed up in help and never replied
export class MergeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.EFFECTS,
      },
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
