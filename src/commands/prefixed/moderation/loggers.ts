import { Collections, Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsLogger } from '../../../api/structures/guildsettings';
import { CommandCategories, EmbedColors, GuildLoggerTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { Paginator, Parameters, chunkArray, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';

import { BaseCommand } from '../basecommand';


const ELEMENTS_PER_PAGE = 10;

export async function createLoggersEmbed(
  context: Command.Context,
  loggers: Collections.BaseCollection<string, GuildSettingsLogger>,
  options: {only?: GuildLoggerTypes | null, title?: string} = {},
) {
  let sorted = loggers.toArray();
  if (options.only) {
    sorted = sorted.filter((logger) => logger.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });
  // maybe compare dates?

  const pages = chunkArray<GuildSettingsLogger>(sorted, ELEMENTS_PER_PAGE);

  let title = options.title || 'Loggers';
  let footer = 'Loggers';

  let onlyText: string | undefined;
  switch (options.only) {
    case GuildLoggerTypes.BANS: onlyText = 'Ban Loggers'; break;
    case GuildLoggerTypes.CHANNELS: onlyText = 'Channel Loggers'; break;
    case GuildLoggerTypes.MEMBERS: onlyText = 'Member Loggers'; break;
    case GuildLoggerTypes.MESSAGES: onlyText = 'Message Loggers'; break;
    case GuildLoggerTypes.ROLES: onlyText = 'Role Loggers'; break;
    case GuildLoggerTypes.USERS: onlyText = 'User Loggers'; break;
    case GuildLoggerTypes.VOICE: onlyText = 'Voice Loggers'; break;
  }
  if (onlyText) {
    footer = `${footer} (Only ${onlyText})`;
  }

  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        embed.setTitle(title);
        embed.setFooter((pageLimit === 1) ? footer : `Page ${pageNumber}/${pageLimit} of ${footer}`);

        const page = pages[pageNumber - 1];
        {
          const description: Array<string> = page.map((logger, i) => {
            let type: string = `${logger.type}`;
            switch (logger.type) {
              case GuildLoggerTypes.BANS: type = 'Ban Logger'; break;
              case GuildLoggerTypes.CHANNELS: type = 'Channel Logger'; break;
              case GuildLoggerTypes.MEMBERS: type = 'Member Logger'; break;
              case GuildLoggerTypes.MESSAGES: type = 'Message Logger'; break;
              case GuildLoggerTypes.ROLES: type = 'Role Logger'; break;
              case GuildLoggerTypes.USERS: type = 'User Logger'; break;
              case GuildLoggerTypes.VOICE: type = 'Voice Logger'; break;
            }
 
            return [
              `${(i * pageNumber) + 1}. **${type}** added ${logger.addedAtText}`,
              `-> By <@${logger.userId}> in <#${logger.channelId}>`,
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
      embed.setDescription(`Currently no ${onlyText} in this guild.`);
    } else {
      embed.setDescription('Currently no loggers are in this guild.');
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
