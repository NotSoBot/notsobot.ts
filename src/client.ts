import {
  Command,
  CommandClient,
  CommandClientOptions,
  CommandClientRunOptions,
} from 'detritus-client';

import { GuildAllowlistTypes, GuildBlocklistTypes, GuildDisableCommandsTypes } from './constants';
import GuildSettingsStore from './stores/guildsettings';


export interface NotSoClientOptions extends CommandClientOptions {
  directory: string, 
}

export interface NotSoClientRunOptions extends CommandClientRunOptions {
  directory?: string,
}

export class NotSoClient extends CommandClient {
  directory?: string;

  constructor(
    options: NotSoClientOptions,
    token?: string,
  ) {
    super(token || '', options);

    if (options.directory) {
      this.directory = options.directory;
    }
  }

  async resetCommands(): Promise<void> {
    this.clear();
    if (this.directory) {
      await this.addMultipleIn(this.directory, {subdirectories: true});
    }
  }

  async run(options: NotSoClientRunOptions = {}) {
    this.directory = options.directory || this.directory;
    if (this.directory) {
      await this.resetCommands();
    }
    return super.run(options);
  }


  async onCommandCheck(context: Command.Context, command: Command.Command) {
    if (context.user.isClientOwner) {
      return true;
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
      const disabledCommands = settings.disabled_commands.filter((disabled) => disabled.command === command.name);
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
            };
            case GuildDisableCommandsTypes.GUILD: {
              return true;
            };
            case GuildDisableCommandsTypes.ROLE: {
              if (member) {
                return member.roles.has(disabled.id);
              }
            };
            case GuildDisableCommandsTypes.USER: {
              return disabled.id === context.userId;
            };
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
            };
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
              };
              case GuildBlocklistTypes.ROLE: {
                if (member) {
                  return member.roles.has(blocked.id);
                }
              };
              case GuildBlocklistTypes.USER: {
                return blocked.id === context.userId;
              };
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
