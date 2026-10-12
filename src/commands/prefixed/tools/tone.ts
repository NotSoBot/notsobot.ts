import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export default class ToneCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'tone',

      metadata: {
        category: CommandCategories.TOOLS,
      },
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
