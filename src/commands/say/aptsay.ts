import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class AptSayCommand extends BaseCommand {
  name = 'aptsay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'aptsay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'aptsay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
