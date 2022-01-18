import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  prefix: string,
}


export const COMMAND_NAME = 'prefixes add';

export default class PrefixesAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['prefix add'],
      disableDm: true,
      label: 'prefix',
      metadata: {
        description: 'Add a custom prefix to the guild. (Bot Mentions will always override this)',
        examples: [
          `${COMMAND_NAME} ..`,
        ],
        type: CommandTypes.SETTINGS,
        usage: '<prefix>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.string({maxLength: 128}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.prefix;
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsPrefixesAdd.CommandArgs) {
    return Formatter.Commands.SettingsPrefixesAdd.createMessage(context, args);
  }
}
