import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'decoy notice';

export interface CommandArgs {
  from?: Structures.Member | Structures.User | null,
  text?: string,
}

export default class DecoyNoticeCommand extends BaseCommand {
  permissionsIgnoreClientOwner = false;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'from', type: Parameters.memberOrUser({allowBots: false})},
      ],
      disableDm: true,
      label: 'text',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Replace the decoy channel\'s notice. Without text your next message there becomes it (or -from someone\'s), with text I post it (reset for the default). Your own words from your account are harder for spam tools to spot than my notice',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -from @Someone`,
          `${COMMAND_NAME} Please don't post here, it removes you from the server`,
          `${COMMAND_NAME} reset`,
        ],
        id: Formatter.Commands.ServerDecoy.COMMAND_ID_NOTICE,
        usage: '(<text>|reset) (-from <user:id|mention|name>)',
      },
      permissions: [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return args.from !== null;
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createNoticeMessage(context, args);
  }
}
