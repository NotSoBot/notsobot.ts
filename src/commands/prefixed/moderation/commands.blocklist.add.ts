import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildCommandsBlocklistTypes, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands blocklist add';

export default class CommandsBlocklistAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds blocklist add'],
      args: [
        {
          aliases: ['channel'],
          name: 'channels',
          type: Parameters.channels({
            types: [
              ChannelTypes.GUILD_CATEGORY,
              ChannelTypes.GUILD_NEWS,
              ChannelTypes.GUILD_TEXT,
            ],
          }),
        },
        {
          aliases: ['role'],
          name: 'roles',
          type: Parameters.roles,
        },
        {
          aliases: ['user'],
          name: 'users',
          type: Parameters.membersOrUsers({allowBots: false}),
        },
      ],
      disableDm: true,
      label: 'command',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Block a command for a Channel/Role/User or Server-Wide',
        examples: [
          `${COMMAND_NAME} rule34`,
          `${COMMAND_NAME} rule34 -channels lobby`,
          `${COMMAND_NAME} rule34 -roles members everyone`,
        ],
        id: Formatter.Commands.ModerationCommandsBlocklistAdd.COMMAND_ID,
        usage: '<command-name> (-channels ...<channel:id|mention|name>) (-roles ...<role:id|mention|name>) (-users ...<user:id|mention|name>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.prefixedCommand,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsBlocklistAdd.CommandArgsBefore) {
    if (!args.command) {
      return false;
    }
    if (args.channels && !args.channels.length) {
      return false;
    }
    if (args.roles && !args.roles.length) {
      return false;
    }
    if (args.users && !args.users.length) {
      return false;
    }
    return true;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsBlocklistAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.command) {
      let errors: Array<string> = [];
      if (args.channels && !args.channels.length) {
        errors.push(translate('moderation.types.channel').toLowerCase());
      }
      if (args.roles && !args.roles.length) {
        errors.push(translate('moderation.types.role').toLowerCase());
      }
      if (args.users && !args.users.length) {
        errors.push(translate('moderation.types.user').toLowerCase());
      }
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.items_not_found', {items: errors.join(', ')})}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.unknown_command')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsBlocklistAdd.CommandArgs) {
    return Formatter.Commands.ModerationCommandsBlocklistAdd.createMessage(context, args);
  }
}
