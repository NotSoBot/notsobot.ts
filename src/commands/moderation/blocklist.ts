import { Collections, Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsBlocklist } from '../../api/structures/guildsettings';
import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';
import { Paginator, Parameters, splitArray, toTitleCase } from '../../utils';

import { BaseCommand } from '../basecommand';


const ELEMENTS_PER_PAGE = 15;

export async function createBlocklistEmbed(
  context: Command.Context,
  blocklist: Collections.BaseCollection<string, GuildSettingsBlocklist>,
  options: {only?: GuildBlocklistTypes | null, title?: string} = {},
) {
  let sorted = blocklist.toArray();
  if (options.only) {
    sorted = sorted.filter((blocked) => blocked.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });
  // maybe compare dates?

  const pages = splitArray<GuildSettingsBlocklist>(sorted, ELEMENTS_PER_PAGE);

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
            let type: string = blocked.type;
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

            return [
              `${(i * pageNumber) + 1}. **${type}** added ${blocked.addedAtText}`,
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
export const guildBlocklistType = (value: string) => {
  if (value) {
    value = value.toLowerCase();
    if (value.endsWith('s')) {
      value = value.slice(0, -1);
    }
    return insideGuildBlocklistTypes(value);
  }
  return null;
};

export interface CommandArgs {
  only: GuildBlocklistTypes | null,
}

export default class BlocklistCommand extends BaseCommand {
  aliases = ['blocklist list'];
  name = 'blocklist';

  disableDm = true;
  label = 'only';
  metadata = {
    description: 'List all channels/roles/users part of the server\'s blocklist.',
    examples: [
      'blocklist',
      'blocklist list channels',
    ],
    type: CommandTypes.MODERATION,
    usage: 'blocklist ?<GuildBlocklistType>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  priority = -2;
  type = guildBlocklistType;

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const { blocklist } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
    return createBlocklistEmbed(context, blocklist, {only: args.only});
  }
}
