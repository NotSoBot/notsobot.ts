import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class TuxSayCommand extends BaseCommand {
  name = 'tuxsay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'tuxsay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'tuxsay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
