import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  prefix: string,
}

export interface CommandArgs {
  prefix: string,
}

export const COMMAND_NAME = 'prefixes replace';

export default class PrefixesReplaceCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['prefix replace', 'prefixes set', 'prefix set'],
      disableDm: true,
      label: 'prefix',
      metadata: {
        category: CommandCategories.SETTINGS,
        description: 'Replace all custom prefixes in the guild. (Bot Mentions will always override this)',
        examples: [
          `${COMMAND_NAME} ..`,
        ],
        id: Formatter.Commands.PrefixesReplace.COMMAND_ID,
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

  async run(context: Command.Context, args: Formatter.Commands.PrefixesReplace.CommandArgs) {
    return Formatter.Commands.PrefixesReplace.createMessage(context, args);
  }
}
