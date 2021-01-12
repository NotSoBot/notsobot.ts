import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'undo';

export class UndoCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Undo your last command',
        examples: [
          COMMAND_NAME,
        ],
        type: CommandTypes.UTILS,
        usage: `${COMMAND_NAME}`,
      },
    });
  }

  run(context: Command.Context) {
    return context.reply('ok');
  }
}
