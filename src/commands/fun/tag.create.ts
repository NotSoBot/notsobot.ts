import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export default class TagCreateCommand extends BaseCommand {
  name = 'tag create';

  aliases = ['t create'];
  metadata = {
    description: 'Create a tag',
    examples: [
      'tag create test im a tag',
    ],
    type: CommandTypes.FUN,
    usage: 'tag create <tagname|"tag name"> <...body>',
  };

  run(context: Command.Context, args: CommandArgs) {

  }
}
