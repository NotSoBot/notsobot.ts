import { InteractionCommandClient, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { InteractionCommandMetadata } from './commands/interactions/basecommand';
import { GuildAllowlistTypes, GuildBlocklistTypes, GuildDisableCommandsTypes } from './constants';
import GuildSettingsStore from './stores/guildsettings';
import UserStore from './stores/users';
import { editOrReply } from './utils';


export class NotSoInteractionClient extends InteractionCommandClient {
  async onCommandCheck(context: Interaction.InteractionContext, command: Interaction.InteractionCommand) {
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

    const { member } = context;
    if (member && (member.isOwner || member.canAdministrator)) {
      return true;
    }

    const metadata = (command.metadata.id) ? (command.metadata as InteractionCommandMetadata) : null;

    const channel = context.channel;
    const parent = (channel) ? channel.parent : null;
    if (settings) {
      const disabledCommands = settings.disabledCommands.filter((disabled) => {
        if (metadata) {
          return metadata.id === disabled.command;
        }
        return command.name === disabled.command;
      });
      if (disabledCommands.length) {
        const shouldIgnore = disabledCommands.some((disabled) => {
          switch (disabled.type) {
            case GuildDisableCommandsTypes.CHANNEL: {
              if (disabled.id === context.channelId) {
                return true;
              }
              if (channel && channel.parentId === disabled.id) {
                return true;
              }
              if (parent && parent.parentId === disabled.id) {
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
      return true;
    } else {
      // Failed to fetch, got null, just block it lol
    }
    return false;
  }

  async onCommandCancel(context: Interaction.InteractionContext, command: Interaction.InteractionCommand) {
    return editOrReply(context, {
      content: 'Command blocked, either you are not part of the allowlist, you\'re part of the blocklist, or the command is disabled',
      flags: MessageFlags.EPHEMERAL,
    });
  }
}
