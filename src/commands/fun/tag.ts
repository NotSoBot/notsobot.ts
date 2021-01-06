import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export const COMMAND_NAME = 'tag';

export default class TagCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t'],
      metadata: {
        description: 'Show a tag',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} "some tag"`,
        ],
        type: CommandTypes.FUN,
        usage: `${COMMAND_NAME} <...tagname>`,
      },
      priority: -1,
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
