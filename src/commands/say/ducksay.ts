import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class DuckSayCommand extends BaseCommand {
  name = 'ducksay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'ducksay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'ducksay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
