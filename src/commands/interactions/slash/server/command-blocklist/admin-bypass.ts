import { Command, Interaction, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { GuildAdminBypassLists, GuildAdminBypassValues, StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'admin-bypass';

export interface CommandArgs {
  channels?: Array<Structures.Channel> | null,
  command?: Command.Command | null,
  roles?: Array<Structures.Role> | null,
  users?: Array<Structures.Member | Structures.User> | null,
  value: GuildAdminBypassValues,
}

export class ServerCommandBlocklistAdminBypassCommand extends BaseInteractionCommandOption {
  description = 'Set if the server owner and admins skip the command blocklist, or some of its entries';
  descriptionLocalizations = I18n.localizations('commands.commands.blocklist.admin_bypass.description');
  metadata = {
    id: Formatter.Commands.ModerationAdminBypass.COMMANDS_BLOCKLIST_COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.commands.blocklist.admin_bypass.name');

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      options: [
        {
          name: 'value',
          description: 'On, Off, or Default (on for the server setting, the server setting for entries)',
          ...I18n.optionLocalizations('commands.commands.blocklist.admin_bypass.value'),
          choices: Parameters.Slash.oneOf(Formatter.Commands.ModerationAdminBypass.VALUE_CHOICES),
          required: true,
        },
        {name: 'command', description: 'Command name or ID, leave empty for the server setting', ...I18n.optionLocalizations('commands.commands.blocklist.admin_bypass.command'), value: Parameters.prefixedCommand},
        {
          name: 'channels',
          description: 'Channels (Mentions or IDs, separated by spaces)',
          ...I18n.optionLocalizations('commands.commands.blocklist.admin_bypass.channels'),
          value: Parameters.channels({
            types: [
              ChannelTypes.GUILD_CATEGORY,
              ChannelTypes.GUILD_NEWS,
              ChannelTypes.GUILD_TEXT,
            ],
          }),
        },
        {name: 'roles', description: 'Roles (Mentions or IDs, separated by spaces)', ...I18n.optionLocalizations('commands.commands.blocklist.admin_bypass.roles'), value: Parameters.roles},
        {name: 'users', description: 'Users (Mentions or IDs, separated by spaces)', ...I18n.optionLocalizations('commands.commands.blocklist.admin_bypass.users'), value: Parameters.membersOrUsers({allowBots: false})},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationAdminBypass.isValidCommandArgs(args);
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const content = await Formatter.Commands.ModerationAdminBypass.getInvalidCommandArgsText(context, args);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${content}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const targets = (args.command) ? Formatter.Commands.ModerationAdminBypass.getCommandTargets(context, {...args, command: args.command}) : null;
    return Formatter.Commands.ModerationAdminBypass.createMessage(context, GuildAdminBypassLists.COMMANDS_BLOCKLIST, {
      targets,
      value: args.value,
    });
  }
}
