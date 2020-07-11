import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export class MechSayCommand extends BaseCommand {
  name = 'mechsay';

  label = 'text';
  metadata = {
    description: '',
    examples: [
      'mechsay lol',
    ],
    type: CommandTypes.SAY,
    usage: 'mechsay <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
