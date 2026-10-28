import { Command, Interaction } from 'detritus-client';
import { ApplicationCommandTypes, LOCAL_GUILD_ID } from 'detritus-client/lib/constants';

import { uploadCommands } from '../../../api';
import type { RestOptions } from '../../../api/types';
import type { CommandMetadata } from '../../../commands/prefixed/basecommand';
import { CommandCategories, CommandTypes, SLASH_COMMAND_CATEGORY_FALLBACKS } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';


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

// the translations of a description, from the `commands.*.description` key with the same english text (empty when none has it)
function descriptionLocalizations(description: string): Record<string, string> {
  const key = (description) ? I18n.descriptionKeyFromText(description) : null;
  return (key) ? I18n.translationsByLanguage(key) : {};
}

// a slash/context menu command's full name in each language ('leyenda', 'música saltar'), like `fullName` but with every
// part translated on its own (english where a part has none), the way discord shows it
function nameLocalizations(invoker: Interaction.InteractionCommand | Interaction.InteractionCommandOption): Record<string, string> {
  const parts: Array<{localizations: Record<string, string>, name: string}> = [];
  for (let item: Interaction.InteractionCommand | Interaction.InteractionCommandOption | undefined = invoker; item; item = (item as Interaction.InteractionCommandOption).parent) {
    parts.unshift({localizations: I18n.translationsFromDiscordLocales(item.nameLocalizations), name: item.name});
  }
  const result: Record<string, string> = {};
  for (let language of new Set(parts.flatMap((part) => Object.keys(part.localizations)))) {
    const name = parts.map((part) => part.localizations[language] || part.name).join(' ');
    if (name !== invoker.fullName) {
      result[language] = name;
    }
  }
  return result;
}

// a slash command's options in the same shape as a prefixed command's args, with no prefix and `required` set. names,
// descriptions and choice labels carry their translations, the api picks the one for the site's language
function slashArgs(invoker: Interaction.InteractionCommand | Interaction.InteractionCommandOption) {
  const args: Array<any> = [];
  if (invoker._options) {
    for (let [, option] of invoker._options) {
      if (option.isSubCommand || option.isSubCommandGroup) {
        continue;
      }
      args.push({
        aliases: [],
        choices: (option.choices || []).map((choice) => {
          return {
            description: choice.name,
            description_localizations: I18n.translationsFromDiscordLocales(choice.nameLocalizations),
            value: String(choice.value),
          };
        }),
        description: option.description || '',
        description_localizations: I18n.translationsFromDiscordLocales(option.descriptionLocalizations),
        name: option.name,
        name_localizations: I18n.translationsFromDiscordLocales(option.nameLocalizations),
        prefix: '',
        required: !!option.required,
      });
    }
  }
  return args;
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
        description_localizations: descriptionLocalizations(metadata.description || ''),
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

      commands.push({
        args: slashArgs(invoker),
        category: resolveInteractionCategory(id, invoker.metadata.category, prefixedCategories),
        credits: invoker.metadata.credits || [],
        enabled: true,
        description: invoker.description,
        description_localizations: descriptionLocalizations(invoker.description),
        dmable: !invoker.disableDm,
        // the global application command's id, a subcommand mentions its top-level command's (`</tag get:id>`)
        external_id: command.ids.get(LOCAL_GUILD_ID) || null,
        id,
        name: invoker.fullName,
        name_localizations: nameLocalizations(invoker),
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

  // a prefixed command worded differently from its slash command uses the slash command's translations
  const slashLocalizations = new Map<string, Record<string, string>>();
  for (const command of commands) {
    if (command.type === CommandTypes.APPLICATION_SLASH && Object.keys(command.description_localizations).length) {
      slashLocalizations.set(command.id, command.description_localizations);
    }
  }
  for (const command of commands) {
    if (command.type === CommandTypes.PREFIXED && !Object.keys(command.description_localizations).length) {
      command.description_localizations = slashLocalizations.get(command.id) || {};
    }
  }

  // every formatter command with a `PREVIEW`, the api makes the ones that changed after this returns
  const previews: Array<RestOptions.CommandPreview & {id: string}> = [];
  for (let key in Formatter.Commands) {
    const formatter = (Formatter.Commands as any)[key];
    if (formatter.COMMAND_ID && formatter.PREVIEW) {
      previews.push({...formatter.PREVIEW, id: formatter.COMMAND_ID});
    }
  }

  await uploadCommands(context, {commands, previews});

  return displayReply(context, {description: 'ok'});
}
