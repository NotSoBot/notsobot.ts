import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export const COMMAND_NAME = 'merge';

export default class MergeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        type: CommandTypes.IMAGE,
      },
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
