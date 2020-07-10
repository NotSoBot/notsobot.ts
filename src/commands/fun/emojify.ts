import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export default class EmojifyCommand extends BaseCommand {
  name = 'emojify';

  aliases = ['efy'];
  metadata = {
    type: CommandTypes.FUN,
  };

  run(context: Command.Context, args: CommandArgs) {

  }
}
