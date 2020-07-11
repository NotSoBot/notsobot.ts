import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class SheepSayCommand extends BaseCommand {
  name = 'sheepsay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'sheepsay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'sheepsay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
