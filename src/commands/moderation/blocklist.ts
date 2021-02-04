import { Collections, Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsBlocklist } from '../../api/structures/guildsettings';
import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';
import { Paginator, Parameters, chunkArray, createUserEmbed, editOrReply, toTitleCase } from '../../utils';

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

  const pages = chunkArray<GuildSettingsBlocklist>(sorted, ELEMENTS_PER_PAGE);

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
        const embed = createUserEmbed(context.user);
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
              `-> By <@${blocked.userId}>`,
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
    if (options.only) {
      embed.setDescription(`Currently no ${options.only}s is blocked in this guild.`);
    } else {
      embed.setDescription('Currently nothing is blocked in this guild.');
    }
    embed.setFooter(footer);
    return editOrReply(context, {embed});
  }
}


export interface CommandArgs {
  only: GuildBlocklistTypes | null,
}

export const COMMAND_NAME = 'blocklist';

export default class BlocklistCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildBlocklistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildBlocklistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'List all channels/roles/users part of the server\'s blocklist.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        type: CommandTypes.MODERATION,
        usage: '?<GuildBlocklistType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      priority: -2,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const { blocklist } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
    return createBlocklistEmbed(context, blocklist, {only: args.only});
  }
}
