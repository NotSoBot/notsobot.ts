import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'fonts add';

export default class FontsAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['font add'],

      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Save a font file to use by name',
        examples: [
          `${COMMAND_NAME} comic`,
          `${COMMAND_NAME} pacifico https://raw.githubusercontent.com/google/fonts/main/ofl/pacifico/Pacifico-Regular.ttf`,
        ],
        id: Formatter.Commands.FontsAdd.COMMAND_ID,
        premium: true,
        usage: '<name> ?<url>',
      },
      type: [
        {name: 'name'},
        {name: 'url'},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Omit<Formatter.Commands.FontsAdd.CommandArgs, 'server'>) {
    return !!args.name;
  }

  async run(context: Command.Context, args: Omit<Formatter.Commands.FontsAdd.CommandArgs, 'server'>) {
    // a link, or a font file attached to the message (or the one it replies to)
    const url = args.url || await Parameters.fontFileUrl(context);
    return Formatter.Commands.FontsAdd.createMessage(context, {...args, url});
  }
}
