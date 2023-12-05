import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export const COMMAND_NAME = 'identity';

export default class IdentityCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
      },
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
