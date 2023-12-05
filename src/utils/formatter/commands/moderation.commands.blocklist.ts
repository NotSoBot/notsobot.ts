import { Collections, Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsCommandsBlocklist } from '../../../api/structures/guildsettings';
import { CommandCategories, EmbedColors, GuildCommandsBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { Paginator, chunkArray, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'commands.blocklist';

export interface CommandArgs {
  only: GuildCommandsBlocklistTypes | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const guildId = context.guildId!;

  const { commandsBlocklist } = (await GuildSettingsStore.getOrFetch(context, guildId))!;
  return createCommandsBlocklistsEmbed(context, commandsBlocklist, {only: args.only});
}


const ELEMENTS_PER_PAGE = 10;

export async function createCommandsBlocklistsEmbed(
  context: Command.Context | Interaction.InteractionContext,
  commandsBlocklist: Collections.BaseCollection<string, GuildSettingsCommandsBlocklist>,
  options: {only?: GuildCommandsBlocklistTypes | null, title?: string} = {},
) {
  let sorted = commandsBlocklist.toArray();
  if (options.only) {
    sorted = sorted.filter((blocked) => blocked.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });

  const pages = chunkArray<GuildSettingsCommandsBlocklist>(sorted, ELEMENTS_PER_PAGE);

  let title = options.title || 'Commands Blocked';
  let footer = 'Command Blocklist';
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
            let type = `Unknown (${blocked.type})`;
            switch (blocked.type) {
              case GuildCommandsBlocklistTypes.CHANNEL: {
                type = `Channel Blocked (<#${blocked.id}>)`;
              }; break;
              case GuildCommandsBlocklistTypes.GUILD: {
                type = 'Guild Blocked';
              }; break;
              case GuildCommandsBlocklistTypes.ROLE: {
                type = `Role Blocked (<@&${blocked.id}>)`;
              }; break;
              case GuildCommandsBlocklistTypes.USER: {
                type = `User Blocked (<@${blocked.id}>)`;
              }; break;
            }
            return [
              `${(i * pageNumber) + 1}. **${blocked.command}** added ${blocked.addedAtText}`,
              `-> ${type}`,
              `-> By <@${blocked.userId}>`,
            ].join('\n');
          });
          embed.setDescription(description.join('\n'));
        }
        return embed;
      },
    });
    return await paginator.start();
  }
  const embed = createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);

  embed.setTitle(title);
  if (options.only) {
    embed.setDescription(`Currently no commands are blocked for any ${options.only}s in this guild.`);
  } else {
    embed.setDescription('Currently no commands are blocked in this guild.');
  }
  embed.setFooter(footer);
  return editOrReply(context, {embed});
}
