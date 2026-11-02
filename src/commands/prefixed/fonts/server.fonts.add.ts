import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'server fonts add';

export default class ServerFontsAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Save a font file for everyone in the server to use by name',
        examples: [
          `${COMMAND_NAME} comic`,
          `${COMMAND_NAME} pacifico https://raw.githubusercontent.com/google/fonts/main/ofl/pacifico/Pacifico-Regular.ttf`,
        ],
        id: Formatter.Commands.ServerFontsAdd.COMMAND_ID,
        premiumServer: true,
        usage: '<name> ?<url>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: [
        {name: 'name'},
        {name: 'url'},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ServerFontsAdd.CommandArgs) {
    return !!args.name;
  }

  async run(context: Command.Context, args: Formatter.Commands.ServerFontsAdd.CommandArgs) {
    // a link, or a font file attached to the message (or the one it replies to)
    const url = args.url || await Parameters.fontFileUrl(context);
    return Formatter.Commands.ServerFontsAdd.createMessage(context, {...args, url});
  }
}
