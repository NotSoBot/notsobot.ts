import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class MooseSayCommand extends BaseCommand {
  name = 'moosesay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'moosesay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'moosesay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
