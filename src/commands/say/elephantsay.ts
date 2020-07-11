import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class ElephantSayCommand extends BaseCommand {
  name = 'elephantsay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'elephantsay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'elephantsay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
