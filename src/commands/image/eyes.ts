import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export default class EyesCommand extends BaseCommand {
  name = 'eyes';

  metadata = {
    type: CommandTypes.IMAGE,
  };

  run(context: Command.Context, args: CommandArgs) {

  }
}
