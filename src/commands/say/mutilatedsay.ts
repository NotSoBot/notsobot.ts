import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class MutilatedSayCommand extends BaseCommand {
  name = 'mutilatedsay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'mutilatedsay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'mutilatedsay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
