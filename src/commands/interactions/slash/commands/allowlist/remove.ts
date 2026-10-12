import { Interaction } from 'detritus-client';
import { ChannelTypes, MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class CommandsAllowlistRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove a command from the allowlist for Channels/Roles/Users or Server-Wide';
  descriptionLocalizations = I18n.localizations('commands.commands.allowlist.remove.description');
  metadata = {
    id: Formatter.Commands.ModerationCommandsAllowlistRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.commands.allowlist.remove.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_GUILD],
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {name: 'command', description: 'Command name or ID', ...I18n.optionLocalizations('commands.commands.allowlist.remove.command'), required: true, value: Parameters.prefixedCommand},
        {
          name: 'channels',
          description: 'Channels (Mentions or IDs, separated by spaces)',
          ...I18n.optionLocalizations('commands.commands.allowlist.remove.channels'),
          value: Parameters.channels({
            types: [
              ChannelTypes.GUILD_CATEGORY,
              ChannelTypes.GUILD_NEWS,
              ChannelTypes.GUILD_TEXT,
            ],
          }),
        },
        {name: 'roles', description: 'Roles (Mentions or IDs, separated by spaces)', ...I18n.optionLocalizations('commands.commands.allowlist.remove.roles'), value: Parameters.roles},
        {name: 'users', description: 'Users (Mentions or IDs, separated by spaces)', ...I18n.optionLocalizations('commands.commands.allowlist.remove.users'), value: Parameters.membersOrUsers({allowBots: false})},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationCommandsAllowlistRemove.CommandArgsBefore) {
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

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationCommandsAllowlistRemove.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    let content: string;
    if (args.command) {
      const errors: Array<string> = [];
      if (args.channels && !args.channels.length) {
        errors.push(translate('moderation.types.channel').toLowerCase());
      }
      if (args.roles && !args.roles.length) {
        errors.push(translate('moderation.types.role').toLowerCase());
      }
      if (args.users && !args.users.length) {
        errors.push(translate('moderation.types.user').toLowerCase());
      }
      content = translate('moderation.items_not_found', {items: errors.join(', ')});
    } else {
      content = translate('errors.unknown_command');
    }
    return editOrReply(context, {content: `${StatusEmojis.WARNING} ${content}`, flags: MessageFlags.EPHEMERAL});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationCommandsAllowlistRemove.CommandArgs) {
    return Formatter.Commands.ModerationCommandsAllowlistRemove.createMessage(context, {
      channels: args.channels || null,
      command: args.command,
      roles: args.roles || null,
      users: args.users || null,
    });
  }
}
