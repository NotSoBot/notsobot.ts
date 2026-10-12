import moment from 'moment';

import { Collections, Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsLogger } from '../../../api/structures/guildsettings';
import { CommandCategories, EmbedColors, GuildLoggerTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { I18n, Paginator, Parameters, chunkArray, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';

import { BaseCommand } from '../basecommand';


const ELEMENTS_PER_PAGE = 10;

export async function createLoggersEmbed(
  context: Command.Context,
  loggers: Collections.BaseCollection<string, GuildSettingsLogger>,
  options: {only?: GuildLoggerTypes | null, title?: string} = {},
) {
  const { language, translate } = await I18n.getTranslator(context);

  let sorted = loggers.toArray();
  if (options.only) {
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
        const embed = createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        embed.setTitle(title);
        embed.setFooter((pageLimit === 1) ? footer : translate('moderation.page_of', {footer, page: pageNumber, total: pageLimit}));

        const page = pages[pageNumber - 1];
        {
          const description: Array<string> = page.map((logger, i) => {
            let type: string = `${logger.type}`;
            switch (logger.type) {
              case GuildLoggerTypes.BANS: type = translate('loggers.type.ban'); break;
              case GuildLoggerTypes.CHANNELS: type = translate('loggers.type.channel'); break;
              case GuildLoggerTypes.MEMBERS: type = translate('loggers.type.member'); break;
              case GuildLoggerTypes.MESSAGES: type = translate('loggers.type.message'); break;
              case GuildLoggerTypes.ROLES: type = translate('loggers.type.role'); break;
              case GuildLoggerTypes.USERS: type = translate('loggers.type.user'); break;
              case GuildLoggerTypes.VOICE: type = translate('loggers.type.voice'); break;
            }
 
            return [
              translate('moderation.entry_added', {index: (i * pageNumber) + 1, type, when: moment(logger.added).locale(language).fromNow()}),
              `-> ${translate('loggers.by_in', {channel: `<#${logger.channelId}>`, user: `<@${logger.userId}>`})}`,
            ].join('\n');
          });

          embed.setDescription(description.join('\n'));
        }
        return embed;
      },
    });
    return await paginator.start();
  } else {
    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);

    embed.setTitle(title);
    if (onlyText) {
      embed.setDescription(translate('loggers.empty_only', {types: onlyText}));
    } else {
      embed.setDescription(translate('loggers.empty'));
    }
    embed.setFooter(footer);
    return editOrReply(context, {embed});
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
        category: CommandCategories.MODERATION,
        usage: '?<GuildLoggerTypes>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      priority: -2,
      type: (value: string) => (GuildLoggerTypes as any)[value.toUpperCase()],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const { loggers } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
    return createLoggersEmbed(context, loggers, {only: args.only});
  }
}
