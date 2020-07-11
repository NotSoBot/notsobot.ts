import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class EyesSayCommand extends BaseCommand {
  name = 'eyessay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'eyessay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'eyessay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
