import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class BeavisSayCommand extends BaseCommand {
  name = 'beavissay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'beavissay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'beavissay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
