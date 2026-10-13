import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';

import {
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildCommandsAllowlistTypes,
  GuildCommandsBlocklistTypes,
  UserFlags,
} from '../../../constants';
import { I18n, displayReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'help-permissions-check';

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

  async run(context: Interaction.InteractionContext) {
    const { translate } = await I18n.getTranslator(context);
    let willPrefixCommandsWork = true;

    const description: Array<string> = [];

    const { channel, guild, me, member } = context;
    if (channel) {
      // todo: check if single dm or group dm, single dms i probably could check perms
      description.push(`**${translate('permcheck.channel_permissions')}**`);
      if (context.inDm) {
        if (context.hasServerPermissions) {
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
    if (context.hasServerPermissions) {
      description.push(translate('permcheck.installed'));

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
        if (context.user.isClientOwner) {
          description.push(`-> ${translate('permcheck.bypass_owner')}`);
        } else if (member && (member.isOwner || member.canAdministrator)) {
          description.push(`-> ${translate('permcheck.bypass_admin')}`);
        } else {
          // todo: add command allowlist/blocklist checks, add parameter to slash command for command id
          const parent = (channel) ? channel.parent : null;
  
          const { allowlist } = settings;
          if (allowlist.length) {
            const shouldAllow = allowlist.some((allow) => {
              switch (allow.type) {
                case GuildAllowlistTypes.CHANNEL: {
                  if (allow.id === context.channelId) {
                    return true;
                  }
                  if (channel && channel.parentId === allow.id) {
                    return true;
                  }
                  if (parent && parent.parentId === allow.id) {
                    return true;
                  }
                }; break;
                case GuildAllowlistTypes.ROLE: {
                  if (member) {
                    return member.roles.has(allow.id);
                  }
                }; break;
                case GuildAllowlistTypes.USER: {
                  return allow.id === context.userId;
                };
              }
              return false;
            });
            description.push(`-> ${translate('permcheck.allowlist_bypassed')}: ${(shouldAllow) ? '✅': '❌'}`);
            description.push(`-> ${translate('permcheck.blocklist_bypassed_allowlist')}`);
          } else {
            const { blocklist } = settings;
            if (blocklist.length) {
              const shouldIgnore = blocklist.some((blocked) => {
                switch (blocked.type) {
                  case GuildBlocklistTypes.CHANNEL: {
                    if (blocked.id === context.channelId) {
                      return true;
                    }
                    if (channel && channel.parentId === blocked.id) {
                      return true;
                    }
                    if (parent && parent.parentId === blocked.id) {
                      return true;
                    }
                  }; break;
                  case GuildBlocklistTypes.ROLE: {
                    if (member) {
                      return member.roles.has(blocked.id);
                    }
                  }; break;
                  case GuildBlocklistTypes.USER: {
                    return blocked.id === context.userId;
                  }; break;
                }
                return false;
              });
              description.push(`-> ${translate('permcheck.allowlist_empty')}`);
              description.push(`-> ${translate('permcheck.blocklist_bypassed')}: ${(!shouldIgnore) ? '✅': '❌'}`);
            } else {
              description.push(`-> ${translate('permcheck.allowlist_empty')}`);
              description.push(`-> ${translate('permcheck.blocklist_empty')}`);
            }
          }
        }
      }
    } else {
      if (context.inDm) {
        description.push(translate('permcheck.group_dm'));
      } else {
        description.push(translate('permcheck.not_installed'));
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
