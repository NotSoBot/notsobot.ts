import { Command, Interaction } from 'detritus-client';
import { ApplicationCommandTypes, LOCAL_GUILD_ID } from 'detritus-client/lib/constants';

import { uploadCommands } from '../../../api';
import type { CommandMetadata } from '../../../commands/prefixed/basecommand';
import { CommandCategories, CommandTypes, SLASH_COMMAND_CATEGORY_FALLBACKS } from '../../../constants';
import { Parameters, displayReply } from '../../../utils';


export const COMMAND_ID = 'owner.upload.commands';

type PremiumLevel = 'premium' | 'premium_plus' | 'premium_server';

// who can use it, for the commands page: null for everyone, else what unlocks it (the same checks `onBefore` runs)
function premiumLevel(metadata?: {premium?: boolean, premiumPlus?: boolean, premiumServer?: unknown} | null): null | PremiumLevel {
  if (!metadata) {
    return null;
  }
  if (metadata.premiumPlus) {
    return 'premium_plus';
  }
  if (metadata.premiumServer) {
    return 'premium_server';
  }
  return (metadata.premium) ? 'premium' : null;
}

// explicit category, else the prefixed command with the same id, else an id-prefix fallback
function resolveInteractionCategory(
  id: string,
  explicit: CommandCategories | undefined,
  prefixedCategories: Map<string, CommandCategories>,
): string {
  if (explicit) {
    return explicit;
  }
  const inherited = prefixedCategories.get(id);
  if (inherited) {
    return inherited;
  }
  const fallback = SLASH_COMMAND_CATEGORY_FALLBACKS.find(([prefix]) => id.startsWith(prefix));
  return (fallback) ? fallback[1] : '';
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const commands: Array<any> = [];
  if (context.commandClient) {
    for (let command of context.commandClient.commands) {
      if (!command.metadata || !command.metadata.category) {
        continue;
      }

      const { args } = command.argParser;
      const metadata = command.metadata as CommandMetadata;

      const names = [...command.names];
      let name: string;
      if (command.arg.prefixes.size) {
        name = names.shift()!;
      } else {
        name = command.name;
        for (let i = 0; i < names.length; i++) {
          if (names[i] === name) {
            names.splice(i, 1);
            break;
          }
        }
      }
      commands.push({
        aliases: names,
        args: args.map((arg) => {
          const argMetadata = arg.metadata || {};
          return {
            aliases: arg.aliases,
            choices: Parameters.getArgChoices(arg),
            description: argMetadata.description || '',
            name: arg.name,
            prefix: Array.from(arg.prefixes).shift() || '',
          };
        }),
        category: metadata.category,
        credits: metadata.credits || [],
        enabled: true,
        description: metadata.description || '',
        dmable: !command.disableDm,
        examples: metadata.examples || [],
        id: metadata.id || name.split(' ').join('.'),
        name,
        nsfw: !!metadata.nsfw,
        premium: premiumLevel(metadata),
        ratelimits: command.ratelimits.map((ratelimit) => {
          return {
            duration: ratelimit.duration,
            key: ratelimit.key,
            limit: ratelimit.limit,
            type: String(ratelimit.type),
          };
        }),
        type: CommandTypes.PREFIXED,
        usage: metadata.usage || '',
      });
    }
  }
  const prefixedCategories = new Map<string, CommandCategories>();
  for (const command of commands) {
    prefixedCategories.set(command.id, command.category);
  }

  if (context.interactionCommandClient) {
    const invokers: Array<[Interaction.InteractionCommand, Interaction.InteractionCommand | Interaction.InteractionCommandOption]> = [];
    for (let command of context.interactionCommandClient.commands) {
      if (command._options && command.isGroup) {
        for (let [x, option] of command._options) {
          if (option._options && option.isSubCommandGroup) {
            for (let [y, opt] of option._options) {
              if (opt.isSubCommand) {
                invokers.push([command, opt]);
              }
            }
          } else if (option.isSubCommand) {
            invokers.push([command, option]);
          }
        }
      } else {
        invokers.push([command, command]);
      }
    }
    for (let [command, invoker] of invokers) {
      if (!invoker.metadata) {
        continue;
      }

      let commandType: number;
      switch (command.type) {
        case ApplicationCommandTypes.CHAT_INPUT: commandType = CommandTypes.APPLICATION_SLASH; break;
        case ApplicationCommandTypes.MESSAGE: commandType = CommandTypes.APPLICATION_MENU_MESSAGE; break;
        case ApplicationCommandTypes.USER: commandType = CommandTypes.APPLICATION_MENU_USER; break;
        default: continue;
      }

      const id = invoker.metadata.id || invoker.fullName.split(' ').join('.');

      // add in args
      commands.push({
        args: [],
        category: resolveInteractionCategory(id, invoker.metadata.category, prefixedCategories),
        credits: invoker.metadata.credits || [],
        enabled: true,
        description: invoker.description,
        dmable: !invoker.disableDm,
        // the global application command's id, a subcommand mentions its top-level command's (`</tag get:id>`)
        external_id: command.ids.get(LOCAL_GUILD_ID) || null,
        id,
        name: invoker.fullName,
        // set on the subcommand, or for all of them on the command
        premium: premiumLevel(invoker.metadata) || premiumLevel((command as any).metadata),
        ratelimits: invoker.ratelimits?.map((ratelimit) => {
          return {
            duration: ratelimit.duration,
            key: ratelimit.key,
            limit: ratelimit.limit,
            type: String(ratelimit.type),
          };
        }),
        type: commandType,
        usage: '',
      });
    }
  }
  await uploadCommands(context, {commands});

  return displayReply(context, {description: 'ok'});
}
