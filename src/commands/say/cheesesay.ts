import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class CheeseSayCommand extends BaseCommand {
  name = 'cheesesay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'cheesesay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'cheesesay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
