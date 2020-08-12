import { Command } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
}

export interface CommandArgs {
  text: string,
}

export default class ReverseTextCommand extends BaseCommand {
  name = 'reversetext';

  label = 'text';
  metadata = {
    description: 'Reverse text',
    examples: [
      'reversetext NotSoBot',
    ],
    type: CommandTypes.FUN,
    usage: 'reversetext <text>',
  };

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('Provide some text.');
  }

  run(context: Command.Context, args: CommandArgs) {
    const text = context.message.convertContent({text: args.text});
    const reversed = text.split('').reverse().join('');
    return context.editOrReply(Markup.escape.all(reversed));
  }
}
