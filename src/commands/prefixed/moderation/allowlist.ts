import { Collections, Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildSettings, GuildSettingsAllowlist } from '../../../api/structures/guildsettings';
import { CommandCategories, EmbedColors, GuildAllowlistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { Paginator, chunkArray, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';

import { BaseCommand } from '../basecommand';


const ELEMENTS_PER_PAGE = 15;

export async function createAllowlistEmbed(
  context: Command.Context,
  allowlist: Collections.BaseCollection<string, GuildSettingsAllowlist>,
  options: {only?: GuildAllowlistTypes | null, title?: string} = {},
) {
  let sorted = allowlist.toArray();
  if (options.only) {
    sorted = sorted.filter((allowed) => allowed.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });
  // maybe compare dates?

  const pages = chunkArray<GuildSettingsAllowlist>(sorted, ELEMENTS_PER_PAGE);

  let title = options.title || 'Allowlist';
  let footer = 'Allowlist';
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
          const description: Array<string> = page.map((allowed, i) => {
            let description = 'Unknown';
            let type: string = allowed.type;
            switch (allowed.type) {
              case GuildAllowlistTypes.CHANNEL: {
                const channel = context.channels.get(allowed.id);
                if (channel && channel.isGuildCategory) {
                  description = `<#${allowed.id}> (Category)`;
                } else {
                  description = `<#${allowed.id}>`;
                }
                type = 'Channel';
              }; break;
              case GuildAllowlistTypes.ROLE: {
                if (allowed.id === context.guildId) {
                  description = '@everyone';
                } else {
                  description = `<@&${allowed.id}>`;
                }
                type = 'Role';
              }; break;
              case GuildAllowlistTypes.USER: {
                description = `<@${allowed.id}>`;
                type = 'User';
              }; break;
            }
            description = `${description} ||(${allowed.id})||`;

            return [
              `${(i * pageNumber) + 1}. **${type}** added ${allowed.addedAtText}`,
              `-> ${description}`,
              `-> By <@${allowed.userId}>`,
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
      embed.setDescription(`Currently no ${options.only}s are inside of the allowlist in this guild.`);
    } else {
      embed.setDescription('Currently nothing is inside of the allowlist in this guild.');
    }
    embed.setFooter(footer);
    return editOrReply(context, {embed});
  }
}


export interface CommandArgs {
  only: GuildAllowlistTypes | null,
}

export const COMMAND_NAME = 'allowlist';

export default class AllowlistCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildAllowlistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildAllowlistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'List all channels/roles/users part of the server\'s allowlist.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        category: CommandCategories.MODERATION,
        usage: '?<GuildAllowlistType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      priority: -2,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const { allowlist } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
    return createAllowlistEmbed(context, allowlist, {only: args.only});
  }
}
