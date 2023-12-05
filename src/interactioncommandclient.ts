import { InteractionCommandClient, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { InteractionCommandMetadata } from './commands/interactions/basecommand';
import {
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildCommandsAllowlistTypes,
  GuildCommandsBlocklistTypes,
} from './constants';
import GuildSettingsStore from './stores/guildsettings';
import UserStore from './stores/users';
import { editOrReply } from './utils';


export class NotSoInteractionClient extends InteractionCommandClient {
  async onCommandCheck(context: Interaction.InteractionContext, command: Interaction.InteractionCommand) {
    if (context.user.isClientOwner) {
      return true;
    }

    context.metadata = context.metadata || {};
    const user = await UserStore.getOrFetch(context, context.userId);
    if (!user || user.blocked) {
      if (user && user.blocked) {
        context.metadata.reason = 'You are blocked from using NotSoBot.';
        if (user.blockedReason) {
          context.metadata.reason = `${context.metadata.reason} (Reason: \`${user.blockedReason}\`)`;
        }
      } else {
        context.metadata.reason = 'Command blocked due to an error fetching your user data, sorry.';
      }
      return false;
    }

    if (context.inDm) {
      if (command.disableDm) {
        context.metadata.reason = 'Command blocked in Direct Messages.';
      }
      return !command.disableDm;
    }

    const guildId = context.guildId!;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings && settings.blocked) {
      // if we aren't able to fetch the settings, it will surpass the blocked setting cuz it's rare to block a guild
      context.metadata.reason = 'This server is blocked from using NotSoBot.';
      if (settings.blockedReason) {
        context.metadata.reason = `${context.metadata.reason} (Reason: \`${settings.blockedReason}\`)`;
      }
      return false;
    }

    const { member } = context;
    if (member && (member.isOwner || member.canAdministrator)) {
      return true;
    }

    const metadata = command.metadata as InteractionCommandMetadata;
    const commandId = metadata.id || command.name.split(' ').join('.');

    const channel = context.channel;
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
        if (!shouldAllow) {
          context.metadata.reason = 'Command blocked, you are not part of the command allowlist.';
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
            context.metadata.reason = 'Command blocked, you are part of the command blocklist.';
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
          context.metadata.reason = 'Command blocked, you are not part of the allowlist.';
        }
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
            context.metadata.reason = 'Command blocked, you are part of the blocklist.';
            return false;
          }
        }
      }
      return true;
    } else {
      // Failed to fetch, got null, just block it lol
      context.metadata.reason = 'Command blocked due to the an error with fetching the server data, sorry.';
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
