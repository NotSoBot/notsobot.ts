import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class FlamingSheepSayCommand extends BaseCommand {
  name = 'flamingsheepsay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'flamingsheepsay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'flamingsheepsay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
