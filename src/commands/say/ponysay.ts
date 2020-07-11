import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class PonySayCommand extends BaseCommand {
  name = 'ponysay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'ponysay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'ponysay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
