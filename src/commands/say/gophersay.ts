import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class GopherSayCommand extends BaseCommand {
  name = 'gophersay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'gophersay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'gophersay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
