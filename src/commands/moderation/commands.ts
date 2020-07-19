import { Collections, Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsDisabledCommand } from '../../api/structures/guildsettings';
import { CommandTypes, EmbedColors, GuildDisableCommandsTypes } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';
import { Paginator, Parameters, splitArray, toTitleCase } from '../../utils';

import { BaseCommand } from '../basecommand';


const ELEMENTS_PER_PAGE = 15;

export async function createDisabledCommandsEmbed(
  context: Command.Context,
  disabledCommands: Collections.BaseCollection<string, GuildSettingsDisabledCommand>,
  options: {only?: GuildDisableCommandsTypes | null, title?: string} = {},
) {
  let sorted = disabledCommands.toArray();
  if (options.only) {
    sorted = sorted.filter((disabled) => disabled.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });

  const pages = splitArray<GuildSettingsDisabledCommand>(sorted, ELEMENTS_PER_PAGE);

  let title = options.title || 'Disabled Commands';
  let footer = 'Disabled Commands List';
  if (options.only) {
    footer = `${footer} (Only ${toTitleCase(options.only)}s)`;
  }
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = new Embed();
        embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
        embed.setColor(EmbedColors.DEFAULT);

        embed.setTitle(title);
        embed.setFooter((pageLimit === 1) ? footer : `Page ${pageNumber}/${pageLimit} of ${footer}`);

        const page = pages[pageNumber - 1];
        {
          const description: Array<string> = page.map((disabled, i) => {
            let type = `Unknown (${disabled.type})`;
            switch (disabled.type) {
              case GuildDisableCommandsTypes.CHANNEL: {
                type = `Channel Disable (<#${disabled.id}>)`;
              }; break;
              case GuildDisableCommandsTypes.GUILD: {
                type = 'Guild Disable';
              }; break;
              case GuildDisableCommandsTypes.ROLE: {
                type = `Role Disable (<@&${disabled.id}>)`;
              }; break;
              case GuildDisableCommandsTypes.USER: {
                type = `User Disable (<@${disabled.id}>)`;
              }; break;
            }
            return [
              `${(i * pageNumber) + 1}. **${disabled.command}** added ${disabled.addedAtText}`,
              `-. ${type}`,
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
    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
    embed.setColor(EmbedColors.DEFAULT);

    embed.setTitle(title);
    if (options.only) {
      embed.setDescription(`Currently no commands are disabled for any ${options.only}s in this guild.`);
    } else {
      embed.setDescription('Currently no commands are disabled in this guild.');
    }
    embed.setFooter(footer);
    return context.editOrReply({embed});
  }
}


const insideGuildDisableCommandsTypes = Parameters.inside(Object.values(GuildDisableCommandsTypes));
export const guildDisableCommandsType = (value: string) => {
  if (value) {
    value = value.toLowerCase();
    if (value.endsWith('s')) {
      value = value.slice(0, -1);
    }
    return insideGuildDisableCommandsTypes(value);
  }
  return null;
};


export interface CommandArgs {
  only: GuildDisableCommandsTypes | null,
}

export default class CommandsCommand extends BaseCommand {
  aliases = ['commands list', 'cmds', 'cmds list'];
  name = 'commands';

  disableDm = true;
  label = 'only';
  metadata = {
    description: 'List all disabled commands (and their associated type)',
    examples: [
      'commands',
      'commands list',
      'commands list channels',
    ],
    type: CommandTypes.MODERATION,
    usage: 'commands ?<GuildDisableCommandsType>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  priority = -1;
  type = guildDisableCommandsType;

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const { disabledCommands } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
    return createDisabledCommandsEmbed(context, disabledCommands, {only: args.only});
  }
}
