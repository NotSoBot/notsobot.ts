import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class MoofasaSayCommand extends BaseCommand {
  name = 'moofasasay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'moofasasay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'moofasasay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
