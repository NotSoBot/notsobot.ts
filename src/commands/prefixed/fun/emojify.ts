import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

// not registered (no default export) until it has an implementation, the empty `run()` showed up in help and never replied
export class EmojifyCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'emojify',

      aliases: ['efy'],
      metadata: {
        category: CommandCategories.FUN,
      },
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
