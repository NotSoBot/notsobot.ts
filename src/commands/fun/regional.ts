import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string, 
}

export interface CommandArgs {
  text: string,
}

export default class RegionalCommand extends BaseCommand {
  name = 'regional';

  label = 'text';
  metadata = {
    description: 'Convert text to regional emojis',
    examples: [
      'regional lol',
    ],
    type: CommandTypes.FUN,
    usage: 'regional <text>',
  };

  run(context: Command.Context, args: CommandArgs) {

  }
}
