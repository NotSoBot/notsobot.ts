import { Collections, Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildSettings, GuildSettingsDisabledCommand } from '../../api/structures/guildsettings';
import { CommandTypes, EmbedColors, GuildDisableCommandsTypes } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';
import { Paginator, chunkArray, createUserEmbed, editOrReply, toTitleCase } from '../../utils';

import { BaseCommand } from '../basecommand';


const ELEMENTS_PER_PAGE = 10;

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

  const pages = chunkArray<GuildSettingsDisabledCommand>(sorted, ELEMENTS_PER_PAGE);

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
        const embed = createUserEmbed(context.user);
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
              `-> ${type}`,
              `-> By <@${disabled.userId}>`,
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
      embed.setDescription(`Currently no commands are disabled for any ${options.only}s in this guild.`);
    } else {
      embed.setDescription('Currently no commands are disabled in this guild.');
    }
    embed.setFooter(footer);
    return editOrReply(context, {embed});
  }
}


export interface CommandArgs {
  only: GuildDisableCommandsTypes | null,
}

export const COMMAND_NAME = 'commands';

export default class CommandsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds'],
      choices: Object.values(GuildDisableCommandsTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildDisableCommandsTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'List all disabled commands (and their associated type)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        type: CommandTypes.MODERATION,
        usage: '?<GuildDisableCommandsType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      priority: -1,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const { disabledCommands } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
    return createDisabledCommandsEmbed(context, disabledCommands, {only: args.only});
  }
}
