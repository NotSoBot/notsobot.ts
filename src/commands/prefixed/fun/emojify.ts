import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

// not registered (no default export) until its formatter has an implementation, an empty command showed up in help and never replied
export class EmojifyCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'emojify',

      aliases: ['efy'],
      metadata: {
        category: CommandCategories.FUN,
        id: Formatter.Commands.FunEmojify.COMMAND_ID,
      },
    });
  }

  run(context: Command.Context, args: Formatter.Commands.FunEmojify.CommandArgs) {
    return Formatter.Commands.FunEmojify.createMessage(context, args);
  }
}
