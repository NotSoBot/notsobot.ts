import { Command, Interaction, Structures } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';

import { editGuildLogger } from '../../../api';
import { GuildSettingsLogger } from '../../../api/structures/guildsettings';
import {
  EmbedColors,
  GUILD_LOGGER_IGNORE_TYPES,
  GuildLoggerTypes,
  MAX_GUILD_LOGGER_IGNORED_AMOUNT,
  StatusEmojis,
} from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { Translator, getTranslator } from '../../i18n';
import { Parameters, displayReply } from '../../../utils';


export const COMMAND_ID = 'server.loggers.ignore';

// what a channel ignore can be, a category covers its channels and a channel its threads
export const IGNORE_CHANNEL_TYPES = [
  ChannelTypes.GUILD_CATEGORY,
  ChannelTypes.GUILD_FORUM,
  ChannelTypes.GUILD_MEDIA,
  ChannelTypes.GUILD_NEWS,
  ChannelTypes.GUILD_STAGE_VOICE,
  ChannelTypes.GUILD_TEXT,
  ChannelTypes.GUILD_VOICE,
];

export interface CommandArgs {
  channels?: Array<Structures.Channel>,
  clear?: boolean,
  // the logger's own channel, only that one changes (Default: every logger of the type). null when it wasn't found
  logger?: Structures.Channel | null,
  roles?: Array<Structures.Role>,
  type: GuildLoggerTypes | null,
  // what the prefixed command couldn't find
  unknown?: Array<string>,
}


export function ignoresRoles(type: GuildLoggerTypes): boolean {
  return type === GuildLoggerTypes.ROLES;
}

export function formatIgnoredId(type: GuildLoggerTypes, id: string): string {
  return (ignoresRoles(type)) ? `<@&${id}>` : `<#${id}>`;
}

export function formatIgnoredIds(translator: Translator, logger: GuildSettingsLogger): string {
  if (!logger.ignoredIds.length) {
    return translator.translate('loggers.ignore.nothing');
  }
  return logger.ignoredIds.map((id) => formatIgnoredId(logger.type, id)).join(', ');
}


// `<type> ...<channel or role>`, the prefixed command's text
export function parseQuery(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): {channels: Array<Structures.Channel>, roles: Array<Structures.Role>, type: GuildLoggerTypes | null, unknown: Array<string>} {
  const [ typeText, ...rest ] = Parameters.stringArguments(value);
  const type = (typeText) ? parseLoggerType(typeText) : null;
  const result = {channels: [] as Array<Structures.Channel>, roles: [] as Array<Structures.Role>, type, unknown: [] as Array<string>};
  const findChannel = Parameters.channel({types: IGNORE_CHANNEL_TYPES});
  for (let text of rest) {
    const found = (type !== null && ignoresRoles(type)) ? Parameters.role(text, context) : findChannel(text, context);
    if (!found) {
      result.unknown.push(text);
    } else if (found instanceof Structures.Role) {
      result.roles.push(found);
    } else {
      result.channels.push(found);
    }
  }
  return result;
}

// the logger type's name, singular or plural (`message`, `messages`)
export function parseLoggerType(value: string): GuildLoggerTypes | null {
  const key = value.toUpperCase();
  for (let name of [key, key.replace(/S$/, ''), `${key}S`]) {
    const type = (GuildLoggerTypes as any)[name];
    if (typeof(type) === 'number') {
      return type;
    }
  }
  return null;
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;
  const reply = (text: string) => displayReply(context, {description: `${StatusEmojis.WARNING} ${text}`, ephemeral: true});

  const types = GUILD_LOGGER_IGNORE_TYPES.map((x) => `\`${GuildLoggerTypes[x].toLowerCase()}\``).join(', ');
  if (args.type === null || !GUILD_LOGGER_IGNORE_TYPES.includes(args.type)) {
    return reply(translate('loggers.ignore.unsupported', {types}));
  }
  const type = args.type;
  if (args.logger === null) {
    return reply(translate('loggers.ignore.unknown_logger'));
  }
  if (args.unknown && args.unknown.length) {
    return reply(translate('loggers.ignore.unknown_targets', {targets: args.unknown.map((x) => `\`${x}\``).join(', ')}));
  }

  const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  if (!settings) {
    return reply(translate('errors.unknown_lol'));
  }
  const loggers = settings.loggers.filter((logger) => {
    return logger.type === type && (!args.logger || logger.channelId === args.logger.id);
  });
  if (!loggers.length) {
    return reply((args.logger) ? translate('loggers.ignore.no_logger_in', {channel: `<#${args.logger.id}>`}) : translate('loggers.ignore.no_loggers'));
  }

  const wrongKind = (ignoresRoles(type)) ? !!(args.channels && args.channels.length) : !!(args.roles && args.roles.length);
  if (wrongKind) {
    return reply((ignoresRoles(type)) ? translate('loggers.ignore.roles_only') : translate('loggers.ignore.channels_only'));
  }
  const targetIds = ((ignoresRoles(type)) ? (args.roles || []) : (args.channels || [])).map((x) => x.id);

  // nothing to change, show what they ignore
  if (!args.clear && !targetIds.length) {
    return displayReply(context, {
      color: EmbedColors.DEFAULT,
      description: [
        ...loggers.map((logger) => `<#${logger.channelId}>: ${formatIgnoredIds(translator, logger)}`),
        `-# ${(ignoresRoles(type)) ? translate('loggers.ignore.note_roles') : translate('loggers.ignore.note_channels')}`,
      ].join('\n'),
      ephemeral: true,
    });
  }

  // one ignored by every logger gets removed from them, otherwise it's added to them
  const removing = targetIds.filter((id) => loggers.every((logger) => logger.ignoredIds.includes(id)));
  const adding = targetIds.filter((id) => !removing.includes(id));

  const changes: Array<{ignoredIds: Array<string>, logger: GuildSettingsLogger}> = [];
  for (let logger of loggers) {
    let ignoredIds: Array<string>;
    if (args.clear) {
      ignoredIds = [];
    } else {
      ignoredIds = logger.ignoredIds.filter((id) => !removing.includes(id));
      for (let id of adding) {
        if (!ignoredIds.includes(id)) {
          ignoredIds.push(id);
        }
      }
    }
    if (MAX_GUILD_LOGGER_IGNORED_AMOUNT < ignoredIds.length) {
      return reply(translate('loggers.ignore.too_many', {channel: `<#${logger.channelId}>`, max: MAX_GUILD_LOGGER_IGNORED_AMOUNT.toLocaleString(language)}));
    }
    if (ignoredIds.length !== logger.ignoredIds.length || ignoredIds.some((id, i) => logger.ignoredIds[i] !== id)) {
      changes.push({ignoredIds, logger});
    }
  }

  let updated = settings.loggers;
  for (let { ignoredIds, logger } of changes) {
    updated = await editGuildLogger(context, context.guildId!, {channelId: logger.channelId, ignoredIds, type});
  }

  const description: Array<string> = [];
  if (args.clear) {
    description.push(translate('loggers.ignore.cleared'));
  } else {
    if (adding.length) {
      description.push(translate('loggers.ignore.added', {targets: adding.map((id) => formatIgnoredId(type, id)).join(', ')}));
    }
    if (removing.length) {
      description.push(translate('loggers.ignore.removed', {targets: removing.map((id) => formatIgnoredId(type, id)).join(', ')}));
    }
  }
  description.push('');
  for (let logger of loggers) {
    const current = updated.find((x) => x.key === logger.key) || logger;
    description.push(`<#${current.channelId}>: ${formatIgnoredIds(translator, current)}`);
  }
  return displayReply(context, {color: EmbedColors.DEFAULT, description: description.join('\n'), ephemeral: true});
}
