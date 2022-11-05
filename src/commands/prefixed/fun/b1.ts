import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'b1';

export default class B1Command extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.FUN,
        description: 'cool',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.FunB1.COMMAND_ID,
        usage: '',
      },
    });
  }

  run(context: Command.Context, args: Formatter.Commands.FunB1.CommandArgs) {
    return Formatter.Commands.FunB1.createMessage(context, args);
  }
}
