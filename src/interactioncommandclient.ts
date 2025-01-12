import { InteractionCommandClient, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from './stores/guildsettings';
import UserStore from './stores/users';
import UserSettingsStore from './stores/usersettings';

import { BaseInteractionCommand, BaseInteractionCommandOption, InteractionCommandMetadata } from './commands/interactions/basecommand';
import {
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildCommandsAllowlistTypes,
  GuildCommandsBlocklistTypes,
} from './constants';
import { Formatter, editOrReply, getCommandIdFromInvoker } from './utils';


export class NotSoInteractionClient extends InteractionCommandClient {
  async onCommandCheck(context: Interaction.InteractionContext, command: Interaction.InteractionCommand) {
    const contextMetadata = context.metadata = context.metadata || {};
    contextMetadata.started = Date.now();

    if (context.user.isClientOwner) {
      return true;
    }

    const user = await UserStore.getOrFetch(context, context.userId);
    if (!user || user.blocked) {
      if (user && user.blocked) {
        contextMetadata.reason = 'You are blocked from using NotSoBot.';
        if (user.blockedReason) {
          contextMetadata.reason = `${contextMetadata.reason} (Reason: \`${user.blockedReason}\`)`;
        }
      } else {
        contextMetadata.reason = 'Command blocked due to an error fetching your user data, sorry.';
      }
      return false;
    }

    if (context.inDm) {
      if (context.invoker.disableDm) {
        contextMetadata.reason = 'Command blocked in Direct Messages.';
      }
      return !context.invoker.disableDm;
    }

    const guildId = context.guildId!;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings && settings.blocked) {
      // if we aren't able to fetch the settings, it will surpass the blocked setting cuz it's rare to block a guild
      contextMetadata.reason = 'This server is blocked from using NotSoBot.';
      if (settings.blockedReason) {
        contextMetadata.reason = `${contextMetadata.reason} (Reason: \`${Markup.codestring(settings.blockedReason)}\`)`;
      }
      return false;
    }

    const { member } = context;
    if (member && (member.isOwner || member.canAdministrator)) {
      return true;
    }

    const invoker = context.invoker as BaseInteractionCommand | BaseInteractionCommandOption;
    const commandId = getCommandIdFromInvoker(invoker);

    const channel = context.channel;
    const parent = (channel) ? channel.parent : null;
    if (settings) {
      const commandsAllowlist = settings.commandsAllowlist.filter((allowed) => {
        return allowed.command === commandId;
      });
      if (commandsAllowlist.length) {
        const shouldAllow = commandsAllowlist.some((allowed) => {
          switch (allowed.type) {
            case GuildCommandsAllowlistTypes.CHANNEL: {
              if (allowed.id === context.channelId) {
                return true;
              }
              if (channel && channel.parentId === allowed.id) {
                return true;
              }
              if (parent && parent.parentId === allowed.id) {
                return true;
              }
            }; break;
            case GuildCommandsAllowlistTypes.GUILD: {
              return true;
            }; break;
            case GuildCommandsAllowlistTypes.ROLE: {
              if (member) {
                return member.roles.has(allowed.id);
              }
            }; break;
            case GuildCommandsAllowlistTypes.USER: {
              return allowed.id === context.userId;
            };
          }
          return false;
        });
        if (!shouldAllow) {
          if (invoker.blockedCommandShouldStillExecute) {
            await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
              flags: MessageFlags.EPHEMERAL,
            });
            return true;
          }
          contextMetadata.reason = 'Command blocked, you are not part of the command allowlist.';
        }
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
                  contextMetadata.reason = 'Command blocked, this channel is part of the server\'s command blocklist.';
                  return true;
                }
                if (channel && channel.parentId === blocked.id) {
                  contextMetadata.reason = 'Command blocked, this channel\'s parent is part of the server\'s command blocklist.';
                  return true;
                }
                if (parent && parent.parentId === blocked.id) {
                  contextMetadata.reason = 'Command blocked, this channel\'s parent\'s parent is part of the server\'s command blocklist.';
                  return true;
                }
              }; break;
              case GuildCommandsBlocklistTypes.GUILD: {
                contextMetadata.reason = 'Command blocked, this server disabled this command.';
                return true;
              }; break;
              case GuildCommandsBlocklistTypes.ROLE: {
                if (member && member.roles.has(blocked.id)) {
                  contextMetadata.reason = `Command blocked, you have a role that is part of the server's command blocklist. (<@&${blocked.id}>)`;
                  return true;
                }
              }; break;
              case GuildCommandsBlocklistTypes.USER: {
                if (blocked.id === context.userId) {
                  contextMetadata.reason = 'Command blocked, you are part of the server\'s command blocklist.';
                  return true;
                }
              };
            }
            return false;
          });
          if (shouldIgnore) {
            if (invoker.blockedCommandShouldStillExecute) {
              await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
                flags: MessageFlags.EPHEMERAL,
              });
              return true;
            }
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
        if (!shouldAllow) {
          if (invoker.blockedCommandShouldStillExecute) {
            await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
              flags: MessageFlags.EPHEMERAL,
            });
            return true;
          }
          contextMetadata.reason = 'Command blocked, you are not part of the allowlist.';
        }
        return shouldAllow;
      } else {
        const { blocklist } = settings;
        if (blocklist.length) {
          const shouldIgnore = blocklist.some((blocked) => {
            switch (blocked.type) {
              case GuildBlocklistTypes.CHANNEL: {
                if (blocked.id === context.channelId) {
                  contextMetadata.reason = 'Command blocked, this channel is part of the server\'s blocklist.';
                  return true;
                }
                if (channel && channel.parentId === blocked.id) {
                  contextMetadata.reason = 'Command blocked, this channel\'s parent is part of the server\'s blocklist.';
                  return true;
                }
                if (parent && parent.parentId === blocked.id) {
                  contextMetadata.reason = 'Command blocked, this channel\'s parent\'s parent is part of the server\'s blocklist.';
                  return true;
                }
              }; break;
              case GuildBlocklistTypes.ROLE: {
                if (member && member.roles.has(blocked.id)) {
                  contextMetadata.reason = `Command blocked, you have a role that is part of the server's blocklist. (<@&${blocked.id}>)`;
                  return true;
                }
              }; break;
              case GuildBlocklistTypes.USER: {
                if (blocked.id === context.userId) {
                  contextMetadata.reason = 'Command blocked, you are part of the server\'s blocklist.';
                  return true;
                }
              }; break;
            }
            return false;
          });
          if (shouldIgnore) {
            if (invoker.blockedCommandShouldStillExecute) {
              await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
                flags: MessageFlags.EPHEMERAL,
              });
              return true;
            }
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
      contextMetadata.reason = 'Command blocked due to the an error with fetching the server data, sorry.';
    }
    return false;
  }

  async onCommandCancel(context: Interaction.InteractionContext, command: Interaction.InteractionCommand) {
    const content = (
      (context.metadata && context.metadata.reason) ||
      'Command blocked, either you are not part of the allowlist, you\'re part of the blocklist, or the command is disabled.'
    );
    return editOrReply(context, {
      content,
      flags: MessageFlags.EPHEMERAL,
    });
  }
}
