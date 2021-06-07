import { Command, CommandClient } from 'detritus-client';

import { GuildAllowlistTypes, GuildBlocklistTypes, GuildDisableCommandsTypes } from './constants';
import GuildSettingsStore from './stores/guildsettings';
import UserStore from './stores/users';


export class NotSoCommandClient extends CommandClient {
  async onCommandCheck(context: Command.Context, command: Command.Command) {
    if (context.user.isClientOwner) {
      return true;
    }
    const user = await UserStore.getOrFetch(context, context.userId);
    if (!user || user.blocked) {
      return false;
    }
    if (context.inDm) {
      return !command.disableDm;
    }
    const { member } = context;
    if (member && (member.isOwner || member.canAdministrator)) {
      return true;
    }
    const guildId = context.guildId as string;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings) {
      const disabledCommands = settings.disabledCommands.filter((disabled) => disabled.command === command.name);
      if (disabledCommands.length) {
        const shouldIgnore = disabledCommands.some((disabled) => {
          switch (disabled.type) {
            case GuildDisableCommandsTypes.CHANNEL: {
              if (disabled.id === context.channelId) {
                return true;
              }
              if (context.channel && context.channel.parentId === disabled.id) {
                return true;
              }
            }; break;
            case GuildDisableCommandsTypes.GUILD: {
              return true;
            }; break;
            case GuildDisableCommandsTypes.ROLE: {
              if (member) {
                return member.roles.has(disabled.id);
              }
            }; break;
            case GuildDisableCommandsTypes.USER: {
              return disabled.id === context.userId;
            }; break;
          }
          return false;
        });
        if (shouldIgnore) {
          return false;
        }
      }
      const { allowlist } = settings;
      if (allowlist.length) {
        const shouldAllow = allowlist.some((allow) => {
          switch (allow.type) {
            case GuildAllowlistTypes.CHANNEL: {
              if (allow.id === context.channelId) {
                return true;
              }
              if (context.channel && context.channel.parentId === allow.id) {
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
            }; break;
          }
          return false;
        });
        return shouldAllow;
      } else {
        const { blocklist } = settings;
        if (blocklist.length) {
          const shouldIgnore = blocklist.some((blocked) => {
            switch (blocked.type) {
              case GuildBlocklistTypes.CHANNEL: {
                if (blocked.id === context.channelId) {
                  return true;
                }
                if (context.channel && context.channel.parentId === blocked.id) {
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
          if (shouldIgnore) {
            return false;
          }
        }
      }
      return true;
    } else {
      // Failed to fetch, got null, just block it lol
    }
    return false;
  }

  async onMessageCheck(context: Command.Context) {
    // ignore bots for automod
    if (context.user.bot) {
      return false;
    }
    // do automod checks
    if (context.guildId) {

    }
    return true;
  }

  async onPrefixCheck(context: Command.Context) {
    if (!context.user.bot && context.guildId) {
      const guildId: string = context.guildId;
  
      const settings = await GuildSettingsStore.getOrFetch(context, guildId);
      if (settings && settings.prefixes.length) {
        return settings.prefixes.map(({prefix}) => prefix);
      }
    }
    return this.prefixes.custom;
  }
}
