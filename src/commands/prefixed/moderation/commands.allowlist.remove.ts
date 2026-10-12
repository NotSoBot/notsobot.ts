import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildCommandsAllowlistTypes, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands allowlist remove';

export default class CommandsAllowlistRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds allowlist remove', 'cmds allowlist rm'],
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
        category: CommandCategories.MODERATION,
        description: 'Remove a command from an allowlist for a Channel/Role/User or Server-Wide',
        examples: [
          `${COMMAND_NAME} rule34`,
          `${COMMAND_NAME} rule34 -channels lobby`,
          `${COMMAND_NAME} rule34 -roles admin everyone`,
        ],
        id: Formatter.Commands.ModerationCommandsAllowlistRemove.COMMAND_ID,
        usage: '<command-name> (-channels ...<channel:id|mention|name>) (-roles ...<role:id|mention|name>) (-users ...<user:id|mention|name>)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.prefixedCommand,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsAllowlistRemove.CommandArgsBefore) {
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

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsAllowlistRemove.CommandArgsBefore) {
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
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('moderation.items_not_found', {items: errors.join(', ')})}`);
    }
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.unknown_command')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsAllowlistRemove.CommandArgs) {
    return Formatter.Commands.ModerationCommandsAllowlistRemove.createMessage(context, args);
  }
}
