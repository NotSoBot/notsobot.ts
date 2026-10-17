import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

// not registered (no default export) until its formatter has an implementation, an empty command showed up in help and never replied
export class ToneCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'tone',

      metadata: {
        category: CommandCategories.AI,
        id: Formatter.Commands.ToolsTone.COMMAND_ID,
      },
    });
  }

  run(context: Command.Context, args: Formatter.Commands.ToolsTone.CommandArgs) {
    return Formatter.Commands.ToolsTone.createMessage(context, args);
  }
}
