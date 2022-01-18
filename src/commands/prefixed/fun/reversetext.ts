import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandTypes } from '../../../constants';
import { editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
}

export interface CommandArgs {
  text: string,
}


const COMMAND_NAME = 'reversetext';

export default class ReverseTextCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        description: 'Reverse text',
        examples: [
          `${COMMAND_NAME} NotSoBot`,
        ],
        type: CommandTypes.FUN,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text;
  }

  run(context: Command.Context, args: CommandArgs) {
    const text = context.message.convertContent({text: args.text});
    const reversed = text.split('').reverse().join('');
    return editOrReply(context, Markup.escape.all(reversed));
  }
}
