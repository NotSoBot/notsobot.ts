import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export class UndoCommand extends BaseCommand {
  name = 'undo';
  metadata = {
    description: 'Undo your last command',
    type: CommandTypes.UTILS,
    usage: 'undo',
  };

  run(context: Command.Context) {
    return context.reply('ok');
  }
}
