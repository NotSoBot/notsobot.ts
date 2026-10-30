import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  clear?: boolean,
  logger?: Structures.Channel | null,
  query: ReturnType<typeof Formatter.Commands.ServerLoggersIgnore.parseQuery>,
}

export const COMMAND_NAME = 'loggers ignore';

export default class LoggersIgnoreCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'clear', type: Boolean},
        {name: 'logger', type: Parameters.channel({types: [ChannelTypes.GUILD_NEWS, ChannelTypes.GUILD_TEXT]})},
      ],
      disableDm: true,
      label: 'query',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Make a logger skip events from channels (messages, channels, voice) or roles (roles). A category covers its channels and a channel its threads, giving one that\'s already ignored stops ignoring it',
        examples: [
          `${COMMAND_NAME} messages`,
          `${COMMAND_NAME} messages #bot-spam #staff`,
          `${COMMAND_NAME} voice afk -logger voice-logs`,
          `${COMMAND_NAME} roles @Muted`,
          `${COMMAND_NAME} messages -clear`,
        ],
        id: Formatter.Commands.ServerLoggersIgnore.COMMAND_ID,
        usage: '<messages|channels|voice|roles> ...<channel|role:id|mention|name> (-logger <text-channel:id|mention|name>) (-clear)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: Formatter.Commands.ServerLoggersIgnore.parseQuery,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ServerLoggersIgnore.createMessage(context, {
      channels: args.query.channels,
      clear: args.clear,
      logger: args.logger,
      roles: args.query.roles,
      type: args.query.type,
      unknown: args.query.unknown,
    });
  }
}
