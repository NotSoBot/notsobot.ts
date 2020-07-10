import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export default class TagCommand extends BaseCommand {
  name = 'tag';

  metadata = {
    description: 'Show a tag',
    examples: [
      'tag some tag',
    ],
    type: CommandTypes.FUN,
    usage: 'tag <...tagname>',
  };
  priority = -1;

  run(context: Command.Context, args: CommandArgs) {

  }
}
