import moment from 'moment';

import { Collections, Command, CommandClient, Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildSettingsLogger } from '../../../api/structures/guildsettings';
import { CommandCategories, EmbedColors, GuildLoggerTypes, StatusEmojis } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { DisplayPayload, I18n, Paginator, Parameters, chunkArray, displayReply, toTitleCase } from '../../../utils';

import { BaseCommand } from '../basecommand';


const ELEMENTS_PER_PAGE = 10;

export function getLoggerTypeText(translate: I18n.Translator['translate'], type: GuildLoggerTypes): string {
  switch (type) {
    case GuildLoggerTypes.BANS: return translate('loggers.type.ban');
    case GuildLoggerTypes.CHANNELS: return translate('loggers.type.channel');
    case GuildLoggerTypes.MEMBERS: return translate('loggers.type.member');
    case GuildLoggerTypes.MESSAGES: return translate('loggers.type.message');
    case GuildLoggerTypes.ROLES: return translate('loggers.type.role');
    case GuildLoggerTypes.USERS: return translate('loggers.type.user');
    case GuildLoggerTypes.VOICE: return translate('loggers.type.voice');
  }
  return `${type}`;
}

export async function createLoggersEmbed(
  context: Command.Context | Interaction.InteractionContext,
  loggers: Collections.BaseCollection<string, GuildSettingsLogger>,
  options: {only?: GuildLoggerTypes | null, title?: string} = {},
) {
  const { language, translate } = await I18n.getTranslator(context);

  let sorted = loggers.toArray();
  if (options.only !== null && options.only !== undefined) {
    sorted = sorted.filter((logger) => logger.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });
  // maybe compare dates?

  const pages = chunkArray<GuildSettingsLogger>(sorted, ELEMENTS_PER_PAGE);

  let title = options.title || translate('loggers.title');
  let footer = translate('loggers.title');

  let onlyText: string | undefined;
  switch (options.only) {
    case GuildLoggerTypes.BANS: onlyText = translate('loggers.types.ban'); break;
    case GuildLoggerTypes.CHANNELS: onlyText = translate('loggers.types.channel'); break;
    case GuildLoggerTypes.MEMBERS: onlyText = translate('loggers.types.member'); break;
    case GuildLoggerTypes.MESSAGES: onlyText = translate('loggers.types.message'); break;
    case GuildLoggerTypes.ROLES: onlyText = translate('loggers.types.role'); break;
    case GuildLoggerTypes.USERS: onlyText = translate('loggers.types.user'); break;
    case GuildLoggerTypes.VOICE: onlyText = translate('loggers.types.voice'); break;
  }
  if (onlyText) {
    footer = translate('loggers.footer_only', {types: onlyText});
  }

  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;

        payload.title = title;
        payload.footer = (pageLimit === 1) ? footer : translate('moderation.page_of', {footer, page: pageNumber, total: pageLimit});

        const page = pages[pageNumber - 1];
        {
          const description: Array<string> = page.map((logger, i) => {
            const type = getLoggerTypeText(translate, logger.type);
            return [
              translate('moderation.entry_added', {index: ((pageNumber - 1) * ELEMENTS_PER_PAGE) + i + 1, type, when: moment(logger.added).locale(language).fromNow()}),
              `-> ${translate('loggers.by_in', {channel: `<#${logger.channelId}>`, user: `<@${logger.userId}>`})}`,
            ].join('\n');
          });

          payload.description = description.join('\n');
        }
        return {display: payload};
      },
    });
    return await paginator.start();
  } else {
    const payload: DisplayPayload = {fields: []};
    payload.color = EmbedColors.DEFAULT;

    payload.title = title;
    if (onlyText) {
      payload.description = translate('loggers.empty_only', {types: onlyText});
    } else {
      payload.description = translate('loggers.empty');
    }
    payload.footer = footer;
    return displayReply(context, payload);
  }
}


export interface CommandArgs {
  only: GuildLoggerTypes | null,
}

export const COMMAND_NAME = 'loggers';

export default class LoggersCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildLoggerTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildLoggerTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'List all loggers inside of the server.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} members`,
        ],
        category: CommandCategories.SERVER,
        usage: '?<GuildLoggerTypes>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      priority: -2,
      type: (value: string) => (GuildLoggerTypes as any)[value.toUpperCase()],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (!settings) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.unknown_lol')}`});
    }
    return createLoggersEmbed(context, settings.loggers, {only: args.only});
  }
}
