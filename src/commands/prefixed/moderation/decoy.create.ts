import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'decoy create';

export interface CommandArgs {
  from?: Structures.Member | Structures.User | null,
  in?: Structures.Channel | null,
  me?: boolean,
  name?: string,
}

export default class DecoyCreateCommand extends BaseCommand {
  // NotSoBot's owners don't skip the member permissions here, it removes people
  permissionsIgnoreClientOwner = false;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'in', type: Parameters.channel({types: [ChannelTypes.GUILD_CATEGORY]})},
        {name: 'me', type: Boolean},
        {name: 'from', type: Parameters.memberOrUser({allowBots: false})},
      ],
      disableDm: true,
      label: 'name',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Make a decoy channel: anyone who posts in it is removed and their recent messages deleted, catching spam accounts that post everywhere. Without a name it gets one that fits the server\'s other channels. With -me, your next message there becomes its notice instead of mine: write it in your own words, spam tools can spot what NotSoBot posts',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} media-dump`,
          `${COMMAND_NAME} -me`,
          `${COMMAND_NAME} -in archive -from @Someone`,
        ],
        id: Formatter.Commands.ServerDecoy.COMMAND_ID_CREATE,
        usage: '(<name>) (-in <category:id|mention|name>) (-me) (-from <user:id|mention|name>)',
      },
      permissions: [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return args.in !== null && args.from !== null;
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createCreateMessage(context, {
      from: args.from,
      in: args.in,
      name: args.name,
      notice: (args.me || args.from) ? 'me' : 'bot',
    });
  }
}
