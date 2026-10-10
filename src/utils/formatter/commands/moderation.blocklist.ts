import { Collections, Command, Interaction } from 'detritus-client';

import { GuildSettings, GuildSettingsBlocklist } from '../../../api/structures/guildsettings';
import { EmbedColors, GuildBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { Paginator, chunkArray, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';


export interface CommandArgs {
  only: GuildBlocklistTypes | null,
}

const ELEMENTS_PER_PAGE = 15;

export async function createBlocklistEmbed(
  context: Command.Context | Interaction.InteractionContext,
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
                const channel = context.client.channels.get(blocked.id);
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

export const COMMAND_ID = 'blocklist';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const guildId = context.guildId as string;

  const { blocklist } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
  return createBlocklistEmbed(context, blocklist, {only: args.only});
}
