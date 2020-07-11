import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class BondSayCommand extends BaseCommand {
  name = 'bongsay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'bongsay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'bongsay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
