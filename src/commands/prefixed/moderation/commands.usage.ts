import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GUILD_TEXT_CHANNEL_TYPES, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply, getCommandIdFromInvoker } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands usage';

export default class CommandsUsageCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds usage'],
      args: [
        {
          name: 'channel',
          type: Parameters.channel({
            types: [
              ...GUILD_TEXT_CHANNEL_TYPES,
            ],
          }),
        },
        {
          name: 'user',
          type: Parameters.memberOrUser({allowBots: false}),
        },
      ],
      label: 'command',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Show the latest commands used in this server',
        examples: [
          `${COMMAND_NAME} imagine`,
          `${COMMAND_NAME} imagine -channel lobby`,
          `${COMMAND_NAME} imagine -user cake`,
        ],
        id: Formatter.Commands.ModerationCommandsUsage.COMMAND_ID,
        usage: '<command-name> (-channel <channel:id|mention|name>) (-user <user:id|mention|name>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      // the command name (or id) only filters when it's given, it used to be read and never sent
      type: Parameters.prefixedCommand,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsUsage.CommandArgsBefore) {
    // a name was given but no command has it (nothing given leaves it as '')
    if (args.command === null) {
      return false;
    }
    if (args.channel !== undefined && !args.channel) {
      return false;
    }
    if (args.user !== undefined && !args.user) {
      return false;
    }
    return true;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsUsage.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    let errors: Array<string> = [];
    if (args.command === null) {
      errors.push('command');
    }
    if (args.channel !== undefined && !args.channel) {
      errors.push('channel');
    }
    if (args.user !== undefined && !args.user) {
      errors.push('user');
    }
    if (errors.length) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.items_not_found', {items: errors.join(', ')})}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsUsage.CommandArgsBefore) {
    return Formatter.Commands.ModerationCommandsUsage.createMessage(context, {
      channel: args.channel || undefined,
      commandId: (args.command) ? getCommandIdFromInvoker(args.command) : undefined,
      user: args.user || undefined,
    });
  }
}
