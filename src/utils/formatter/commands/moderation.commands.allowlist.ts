import { Collections, Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsCommandsAllowlist } from '../../../api/structures/guildsettings';
import { CommandCategories, EmbedColors, GuildCommandsAllowlistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { Paginator, chunkArray, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'moderation.commands.allowlist';

export interface CommandArgs {
  only: GuildCommandsAllowlistTypes | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const guildId = context.guildId!;

  const { commandsAllowlist } = (await GuildSettingsStore.getOrFetch(context, guildId))!;
  return createCommandsAllowlistsEmbed(context, commandsAllowlist, {only: args.only});
}


const ELEMENTS_PER_PAGE = 10;

export async function createCommandsAllowlistsEmbed(
  context: Command.Context | Interaction.InteractionContext,
  commandsAllowlist: Collections.BaseCollection<string, GuildSettingsCommandsAllowlist>,
  options: {only?: GuildCommandsAllowlistTypes | null, title?: string} = {},
) {
  let sorted = commandsAllowlist.toArray();
  if (options.only) {
    sorted = sorted.filter((allowed) => allowed.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });

  const pages = chunkArray<GuildSettingsCommandsAllowlist>(sorted, ELEMENTS_PER_PAGE);

  let title = options.title || 'Commands Allowlisted';
  let footer = 'Command Allowlist';
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
            let type = `Unknown (${allowed.type})`;
            switch (allowed.type) {
              case GuildCommandsAllowlistTypes.CHANNEL: {
                type = `Channel Allowed (<#${allowed.id}>)`;
              }; break;
              case GuildCommandsAllowlistTypes.GUILD: {
                type = 'Guild Allowed';
              }; break;
              case GuildCommandsAllowlistTypes.ROLE: {
                type = `Role Allowed (<@&${allowed.id}>)`;
              }; break;
              case GuildCommandsAllowlistTypes.USER: {
                type = `User Allowed (<@${allowed.id}>)`;
              }; break;
            }
            return [
              `${(i * pageNumber) + 1}. **${allowed.command}** added ${allowed.addedAtText}`,
              `-> ${type}`,
              `-> By <@${allowed.userId}>`,
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
    embed.setDescription(`Currently there are no commands allowlisted for any ${options.only}s in this guild.`);
  } else {
    embed.setDescription('Currently there are no commands allowlisted in this guild.');
  }
  embed.setFooter(footer);
  return editOrReply(context, {embed});
}
