import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class DinoSayCommand extends BaseCommand {
  name = 'dinosay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'dinosay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'dinosay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
