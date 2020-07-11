import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class HeadInAssSayCommand extends BaseCommand {
  name = 'headinasssay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'headinasssay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'headinasssay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
