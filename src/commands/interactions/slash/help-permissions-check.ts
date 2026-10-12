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
import { I18n, editOrReply } from '../../../utils';

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
    let willPrefixCommandsWork = true;

    const description: Array<string> = [];

    const { channel, guild, me, member } = context;
    if (channel) {
      // todo: check if single dm or group dm, single dms i probably could check perms
      description.push('**Bot Channel Permissions**');
      if (context.inDm) {
        if (context.hasServerPermissions) {
          description.push(`-> Send Message: ✅`);
          description.push(`-> View: ✅`);
        } else {
          description.push(`-> Send Message: ✅`);
          description.push(`-> View: ❌`);
          willPrefixCommandsWork = false;
        }
      } else {
        description.push(`-> Send Message: ${(channel.can([Permissions.SEND_MESSAGES])) ? '✅': '❌'}`);
        description.push(`-> View: ${(channel.can([Permissions.VIEW_CHANNEL])) ? '✅': '❌'}`);
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
        description.push('**Bot Timed Out**');
        description.push('-> Can Message: ❌');
        description.push(`-> Until ${Markup.timestamp(me.communicationDisabledUntil)}`);
        willPrefixCommandsWork = false;
      }
      // maybe do other checks here?
    }

    description.push('');
    if (context.hasServerPermissions) {
      description.push('Bot is installed in this Server');

      description.push('');
      description.push('**Server Prefixes**');
      if (context.commandClient) {
        const mentionPrefixes = context.commandClient.prefixes.mention.map((x) => Markup.codestring(x));
        description.push('-> ' + mentionPrefixes.join(', '));
      }

      const settings = (guild) ? await GuildSettingsStore.getOrFetch(context, guild.id) : null;
      if (settings && settings.prefixes.length) {
        description.push(`-> Custom Prefixes`);
        for (let [x, item] of settings.prefixes) {
          description.push(`--> ${Markup.codestring(item.prefix)}`);
        }
      } else {
        description.push('-> Default Prefix: `.`');
      }

      if (settings) {
        description.push('');
        description.push('**Current User Allowlist/Blocklist Permissions**');
        if (context.user.isClientOwner) {
          description.push('-> User Bypasses All Allowlist/Blocklist Restrictions due to being a Bot Owner');
        } else if (member && (member.isOwner || member.canAdministrator)) {
          description.push('-> User Bypasses All Allowlist/Blocklist Restrictions due to having Administrator');
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
            description.push(`-> Server Allowlist Bypassed: ${(shouldAllow) ? '✅': '❌'}`);
            description.push(`-> Server Blocklist Bypassed due to Allowlist being present`);
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
              description.push(`-> Server Allowlist Bypassed due to it being empty`);
              description.push(`-> Server Blocklist Bypassed: ${(!shouldIgnore) ? '✅': '❌'}`);
            } else {
              description.push(`-> Server Allowlist Bypassed due to it being empty`);
              description.push(`-> Server Blocklist Bypassed due to it being empty`);
            }
          }
        }
      }
    } else {
      if (context.inDm) {
        description.push('Bot cannot be installed in Group DMs');
      } else {
        description.push('Bot is not installed in the Server');
      }
      willPrefixCommandsWork = false;
    }

    const willRespondText = (willPrefixCommandsWork) ? 'WILL' : 'WILL NOT';
    return editOrReply(context, [
      `Bot **${willRespondText}** respond to prefix commands here`,
      '',
      description.join('\n'),
    ].join('\n'));
  }
}
