import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export default class SayCommand extends BaseCommand {
  name = 'say';

  label = 'text';
  metadata = {
    description: 'Have the bot say something (owner only bc exploits)',
    examples: [
      'say :spider:',
    ],
    type: CommandTypes.OWNER,
    usage: 'say <text>',
  };

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: CommandArgs) {
    return context.reply(args.text);
  }
}
