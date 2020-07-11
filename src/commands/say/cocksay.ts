import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class CockSayCommand extends BaseCommand {
  name = 'cocksay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'cocksay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'cocksay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
