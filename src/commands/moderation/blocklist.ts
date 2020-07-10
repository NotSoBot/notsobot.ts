import * as moment from 'moment';

import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import GuildSettingsStore, { GuildSettingsStored } from '../../stores/guildsettings';
import { RestResponses } from '../../types';
import { Paginator, Parameters, toTitleCase } from '../../utils';

import { BaseCommand } from '../basecommand';


const ELEMENTS_PER_PAGE = 15;

export async function createBlocklistEmbed(
  context: Command.Context,
  blocklist: Array<RestResponses.GuildBlocklist>,
  options: {only?: GuildBlocklistTypes, title?: string} = {},
) {
  let sorted = blocklist.slice();
  if (options.only) {
    sorted = sorted.filter((blocked) => blocked.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });
  // maybe compare dates?

  const pages: Array<Array<RestResponses.GuildBlocklist>> = [];
  for (let i = 0; i < sorted.length; i += ELEMENTS_PER_PAGE) {
    const page: Array<RestResponses.GuildBlocklist> = [];
    for (let blocked of sorted.slice(i, i + ELEMENTS_PER_PAGE)) {
      page.push(blocked);
    }
    if (page.length) {
      pages.push(page);
    }
  }

  let title = options.title || 'Blocklist';
  let footer = 'Blocklist';
  if (options.only) {
    footer = `${footer} (Only ${toTitleCase(options.only)}s)`;
  }
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = new Embed();
        embed.setAuthor(String(context.user), context.user.avatarUrl, context.user.jumpLink);
        embed.setColor(EmbedColors.DEFAULT);

        embed.setTitle(title);
        embed.setFooter((pageLimit === 1) ? footer : `Page ${pageNumber}/${pageLimit} of ${footer}`);

        const page = pages[pageNumber - 1];
        {
          const description: Array<string> = page.map((blocked, i) => {
            let description = 'Unknown';
            let type = blocked.type;
            switch (blocked.type) {
              case GuildBlocklistTypes.CHANNEL: {
                const channel = context.channels.get(blocked.id);
                if (channel && channel.isGuildCategory) {
                  description = `<#${blocked.id}> (Category)`;
                } else {
                  description = `<#${blocked.id}>`;
                }
                type = 'Channel';
              }; break;
              case GuildBlocklistTypes.ROLE: {
                if (blocked.id === context.guildId) {
                  description = '@everyone';
                } else {
                  description = `<@&${blocked.id}>`;
                }
                type = 'Role';
              }; break;
              case GuildBlocklistTypes.USER: {
                description = `<@${blocked.id}>`;
                type = 'User';
              }; break;
            }
            description = `${description} ||(${blocked.id})||`;

            const added = moment(blocked.added).fromNow();
            return [
              `${(i * pageNumber) + 1}. **${type}** added ${added}`,
              `-> ${description}`,
            ].join('\n');
          });

          embed.setDescription(description.join('\n'));
        }
        return embed;
      },
    });
    return await paginator.start();
  } else {
    const embed = new Embed();
    embed.setAuthor(String(context.user), context.user.avatarUrl, context.user.jumpLink);
    embed.setColor(EmbedColors.DEFAULT);

    embed.setTitle(title);
    if (options.only) {
      embed.setDescription(`Currently no ${options.only}s is blocked in this guild.`);
    } else {
      embed.setDescription('Currently nothing is blocked in this guild.');
    }
    embed.setFooter(footer);
    return context.editOrReply({embed});
  }
}

const insideGuildBlocklistTypes = Parameters.inside(Object.values(GuildBlocklistTypes));


export interface CommandArgs {
  only?: GuildBlocklistTypes,
}

export default class BlocklistCommand extends BaseCommand {
  aliases = ['blocklist list'];
  name = 'blocklist';

  disableDm = true;
  metadata = {
    description: 'List all channels/roles/users part of the server\'s blocklist.',
    examples: [
      'blocklist',
      'blocklist list',
    ],
    type: CommandTypes.MODERATION,
    usage: 'blocklist (-only <GuildBlocklistType>)',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  priority = -2;

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [
        {name: 'only', type: (value: string) => insideGuildBlocklistTypes(value.toLowerCase())},
      ],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const { blocklist } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettingsStored;
    return createBlocklistEmbed(context, blocklist, {only: args.only});
  }
}
