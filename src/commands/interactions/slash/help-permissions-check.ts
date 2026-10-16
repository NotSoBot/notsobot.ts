import { Command, Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { GuildSettingsListItem } from '../../../api/structures/guildsettings';
import GuildSettingsStore from '../../../stores/guildsettings';

import { GuildCommandsAllowlistTypes, StatusEmojis } from '../../../constants';
import { I18n, Parameters, displayReply, getCommandIdFromInvoker, isGuildListCommandId } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'help-permissions-check';

export interface CommandArgs {
  command?: Command.Command | false,
}

export default class HelpPermissionsCheckCommand extends BaseSlashCommand {
  description = 'Help, the bot doesn\'t respond to prefix commands';
  descriptionLocalizations = I18n.localizations('commands.help_permissions_check.description');
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.help_permissions_check.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        {
          name: 'command',
          description: 'Command name or ID',
          ...I18n.optionLocalizations('commands.help_permissions_check.command'),
          value: async (value: string, context: Interaction.InteractionContext) => {
            return (await Parameters.prefixedCommand(value, context)) || false;
          },
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (args.command === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.unknown_command')}`});
    }
    let willPrefixCommandsWork = true;

    const description: Array<string> = [];

    const { channel, guild, me, member } = context;
    if (channel) {
      description.push(`**${translate('permcheck.channel_permissions')}**`);
      if (context.inDm) {
        // the bot can always see its own dms, but never dms/group dms between users
        if (context.inDmWithBot) {
          description.push(`-> ${translate('permcheck.send_message')}: ✅`);
          description.push(`-> ${translate('permcheck.view')}: ✅`);
        } else {
          description.push(`-> ${translate('permcheck.send_message')}: ✅`);
          description.push(`-> ${translate('permcheck.view')}: ❌`);
          willPrefixCommandsWork = false;
        }
      } else {
        description.push(`-> ${translate('permcheck.send_message')}: ${(channel.can([Permissions.SEND_MESSAGES])) ? '✅': '❌'}`);
        description.push(`-> ${translate('permcheck.view')}: ${(channel.can([Permissions.VIEW_CHANNEL])) ? '✅': '❌'}`);
        willPrefixCommandsWork = channel.canMessage;
      }
    }

    if (me) {
      if (
        me.communicationDisabledUntilUnix &&
        Date.now() < me.communicationDisabledUntilUnix &&
        !me.canAdministrator
      ) {
        description.push('');
        description.push(`**${translate('permcheck.timed_out')}**`);
        description.push(`-> ${translate('permcheck.can_message')}: ❌`);
        description.push(`-> ${translate('permcheck.until', {time: Markup.timestamp(me.communicationDisabledUntil)})}`);
        willPrefixCommandsWork = false;
      }
      // maybe do other checks here?
    }

    description.push('');
    // prefix commands only need the bot user in the server, not the server install of the slash commands (`isFromGuildInstall`)
    if (context.isBotPresent) {
      if (context.inDmWithBot) {
        description.push(translate('permcheck.bot_dm'));
      } else {
        description.push(translate((context.isFromGuildInstall) ? 'permcheck.installed' : 'permcheck.installed_bot_only'));
      }

      description.push('');
      description.push(`**${translate('permcheck.server_prefixes')}**`);
      if (context.commandClient) {
        const mentionPrefixes = context.commandClient.prefixes.mention.map((x) => Markup.codestring(x));
        description.push('-> ' + mentionPrefixes.join(', '));
      }

      const settings = (guild) ? await GuildSettingsStore.getOrFetch(context, guild.id) : null;
      if (settings && settings.prefixes.length) {
        description.push(`-> ${translate('permcheck.custom_prefixes')}`);
        for (let [x, item] of settings.prefixes) {
          description.push(`--> ${Markup.codestring(item.prefix)}`);
        }
      } else {
        description.push(`-> ${translate('permcheck.default_prefix')}: \`.\``);
      }

      if (settings) {
        description.push('');
        description.push(`**${translate('permcheck.user_permissions')}**`);
        const isAdmin = !!member && (member.isOwner || member.canAdministrator);
        const isListCommand = !!args.command && isGuildListCommandId(getCommandIdFromInvoker(args.command));
        if (context.user.isClientOwner) {
          description.push(`-> ${translate('permcheck.bypass_owner')}`);
        } else if (isAdmin && (isListCommand || settings.adminBypassesEverything)) {
          description.push(`-> ${translate('permcheck.bypass_admin')}`);
        } else {
          if (isAdmin) {
            description.push(`-> ${translate('permcheck.bypass_admin_partial')}`);
          }
          // same order as `NotSoCommandClient.onCommandCheck`, the server and command lists all share these types
          const parent = (channel) ? channel.parent : null;
          const matches = (item: {id: string, type: string}): boolean => {
            switch (item.type) {
              case GuildCommandsAllowlistTypes.CHANNEL: {
                if (item.id === context.channelId) {
                  return true;
                }
                if (channel && channel.parentId === item.id) {
                  return true;
                }
                if (parent && parent.parentId === item.id) {
                  return true;
                }
              }; break;
              case GuildCommandsAllowlistTypes.GUILD: {
                return true;
              };
              case GuildCommandsAllowlistTypes.ROLE: {
                if (member) {
                  return member.roles.has(item.id);
                }
              }; break;
              case GuildCommandsAllowlistTypes.USER: {
                return item.id === context.userId;
              };
            }
            return false;
          };
          // the owner and admins pass entries they bypass, on an allowlist that lets them in, on a blocklist it's skipped
          const allows = (item: GuildSettingsListItem) => (isAdmin && settings.canAdminBypass(item)) || matches(item);
          const blocks = (item: GuildSettingsListItem) => !(isAdmin && settings.canAdminBypass(item)) && matches(item);

          let checkServerLists = true;
          if (args.command) {
            const commandId = getCommandIdFromInvoker(args.command);
            const commandsAllowlist = settings.commandsAllowlist.filter((allowed) => allowed.command === commandId);
            if (commandsAllowlist.length) {
              // a command allowlist decides by itself, the server lists are never checked
              const shouldAllow = commandsAllowlist.some(allows);
              description.push(`-> ${translate('permcheck.command_allowlist_bypassed', {command: Markup.codestring(args.command.name)})}: ${(shouldAllow) ? '✅': '❌'}`);
              description.push(`-> ${translate('permcheck.command_blocklist_bypassed_allowlist')}`);
              description.push(`-> ${translate('permcheck.command_allowlist_overrides')}`);
              if (!shouldAllow) {
                willPrefixCommandsWork = false;
              }
              checkServerLists = false;
            } else {
              description.push(`-> ${translate('permcheck.command_allowlist_empty', {command: Markup.codestring(args.command.name)})}`);
              const commandsBlocklist = settings.commandsBlocklist.filter((blocked) => blocked.command === commandId);
              if (commandsBlocklist.length) {
                const shouldIgnore = commandsBlocklist.some(blocks);
                description.push(`-> ${translate('permcheck.command_blocklist_bypassed', {command: Markup.codestring(args.command.name)})}: ${(!shouldIgnore) ? '✅': '❌'}`);
                if (shouldIgnore) {
                  willPrefixCommandsWork = false;
                }
              } else {
                description.push(`-> ${translate('permcheck.command_blocklist_empty', {command: Markup.codestring(args.command.name)})}`);
              }
            }
          }

          if (checkServerLists) {
            const { allowlist, blocklist } = settings;
            if (allowlist.length) {
              const shouldAllow = allowlist.some(allows);
              description.push(`-> ${translate('permcheck.allowlist_bypassed')}: ${(shouldAllow) ? '✅': '❌'}`);
              description.push(`-> ${translate('permcheck.blocklist_bypassed_allowlist')}`);
              if (!shouldAllow) {
                willPrefixCommandsWork = false;
              }
            } else if (blocklist.length) {
              const shouldIgnore = blocklist.some(blocks);
              description.push(`-> ${translate('permcheck.allowlist_empty')}`);
              description.push(`-> ${translate('permcheck.blocklist_bypassed')}: ${(!shouldIgnore) ? '✅': '❌'}`);
              if (shouldIgnore) {
                willPrefixCommandsWork = false;
              }
            } else {
              description.push(`-> ${translate('permcheck.allowlist_empty')}`);
              description.push(`-> ${translate('permcheck.blocklist_empty')}`);
            }
          }
        }
      }
    } else {
      if (context.inDm) {
        description.push(translate((channel && channel.isDmGroup) ? 'permcheck.group_dm' : 'permcheck.user_dm'));
      } else {
        description.push(translate((context.isFromGuildInstall) ? 'permcheck.installed_commands_only' : 'permcheck.not_installed'));
      }
      willPrefixCommandsWork = false;
    }

    return displayReply(context, {description: [
      translate((willPrefixCommandsWork) ? 'permcheck.will_respond' : 'permcheck.will_not_respond'),
      '',
      description.join('\n'),
    ].join('\n')});
  }
}
