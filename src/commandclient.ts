import { Command, CommandAttributes, CommandClient, Interaction } from 'detritus-client';
import { LOCAL_GUILD_ID } from 'detritus-client/lib/constants';

import { BaseInteractionCommand } from './commands/interactions/basecommand';
import { CommandMetadata } from './commands/prefixed/basecommand';

import GuildSettingsStore from './stores/guildsettings';
import UserStore from './stores/users';
import UserSettingsStore from './stores/usersettings';

import {
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildCommandsAllowlistTypes,
  GuildCommandsBlocklistTypes,
  UserFlags,
} from './constants';
import { Formatter, getCommandIdFromInvoker } from './utils';


export class NotSoCommandClient extends CommandClient {
  async onCommandCheck(context: Command.Context, command: Command.Command) {
    if (context.metadata) {
      context.metadata.started = Date.now();
    }

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

    const guildId = context.guildId!;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings && settings.blocked) {
      // if we aren't able to fetch the settings, it will surpass the blocked setting cuz it's rare to block a guild
      return false;
    }

    const { channel, member } = context;
    if (member && (member.isOwner || member.canAdministrator)) {
      return true;
    }

    const commandId = getCommandIdFromInvoker(command);
    if (context.interactionCommandClient && context.channel && member) {
      const interactionCommand = context.interactionCommandClient.commands.find((x): x is BaseInteractionCommand => {
        return x instanceof BaseInteractionCommand && x.commandIds.has(commandId);
      });
      if (interactionCommand) {
        try {
          await context.client.applicationCommandPermissions.fill(guildId);
        } catch(error) {
          
        }
        const applicationCommandPermissions = context.client.applicationCommandPermissions.get(guildId);
        if (applicationCommandPermissions && applicationCommandPermissions.length) {
          const applicationCommandIds = [
            interactionCommand.ids.get(LOCAL_GUILD_ID),
            interactionCommand.ids.get(guildId),
          ].filter(Boolean) as Array<string>;
          for (let applicationCommandId of applicationCommandIds) {
            const applicationCommandPermission = applicationCommandPermissions.get(applicationCommandId);
            if (applicationCommandPermission && !applicationCommandPermission.isAllowed(context.channel, member)) {
              return false;
            }
          }
        }
      }
    }

    const parent = (channel) ? channel.parent : null;
    if (settings) {
      const commandsAllowlist = settings.commandsAllowlist.filter((allowed) => {
        return allowed.command === commandId;
      });
      if (commandsAllowlist.length) {
        const shouldAllow = commandsAllowlist.some((allow) => {
          switch (allow.type) {
            case GuildCommandsAllowlistTypes.CHANNEL: {
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
            case GuildCommandsAllowlistTypes.GUILD: {
              return true;
            }; break;
            case GuildCommandsAllowlistTypes.ROLE: {
              if (member) {
                return member.roles.has(allow.id);
              }
            }; break;
            case GuildCommandsAllowlistTypes.USER: {
              return allow.id === context.userId;
            };
          }
          return false;
        });
        return shouldAllow;
      } else {
        const commandsBlocklist = settings.commandsBlocklist.filter((blocked) => {
          return blocked.command === commandId;
        });
        if (commandsBlocklist.length) {
          const shouldIgnore = commandsBlocklist.some((blocked) => {
            switch (blocked.type) {
              case GuildCommandsBlocklistTypes.CHANNEL: {
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
              case GuildCommandsBlocklistTypes.GUILD: {
                return true;
              }; break;
              case GuildCommandsBlocklistTypes.ROLE: {
                if (member) {
                  return member.roles.has(blocked.id);
                }
              }; break;
              case GuildCommandsBlocklistTypes.USER: {
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
          if (shouldIgnore) {
            return false;
          }
        }
      }

      await UserSettingsStore.getOrFetch(context, context.userId);
      // load their settings into cache, todo: maybe only load it as needed?
      // loading as needed breaks the timestamp function in certain situations

      return true;
    } else {
      // Failed to fetch, got null, just block it lol
    }
    return false;
  }

  async getCommand(attributes: CommandAttributes, context?: Command.Context): Promise<Command.Command | null> {
    let command: Command.Command | null = null;

    if (context && this.prefixes.mention.has(attributes.prefix)) {
      command = this.commands.find((x) => x.name === 'ai') || null;
      if (command && typeof(command.onBefore) === 'function') {
        const hasPremium = await Promise.resolve(command.onBefore(context));
        if (!hasPremium) {
          command = null;
        }
      }
    }
    if (!command) {
      command = await Promise.resolve(super.getCommand(attributes, context));
    }
    if (!command && attributes.content) {
      command = this.commands.find((x) => !x.name) || null;
    }
    return command;
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
