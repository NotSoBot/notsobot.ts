import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class CowSayCommand extends BaseCommand {
  name = 'cowsay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'cowsay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'cowsay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
