import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export const COMMAND_NAME = 'tag create';

export default class TagCreateCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t create'],
      metadata: {
        description: 'Create a tag',
        examples: [
          `${COMMAND_NAME} test im a tag`,
        ],
        type: CommandTypes.FUN,
        usage: `${COMMAND_NAME} <tagname|"tag name"> <...body>`,
      },
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
