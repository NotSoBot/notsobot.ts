import * as moment from 'moment';

import { Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, EmbedColors, GuildDisableCommandsTypes } from '../../constants';
import GuildSettingsStore, { GuildSettingsStored } from '../../stores/guildsettings';
import { RestResponses } from '../../types';
import { Paginator } from '../../utils';

import { BaseCommand } from '../basecommand';


const ELEMENTS_PER_PAGE = 15;

export default class CommandsCommand extends BaseCommand {
  aliases = ['cmds', 'commands list', 'cmds list'];
  name = 'commands';

  disableDm = true;
  metadata = {
    description: 'List all disabled commands (and their associated type)',
    examples: [
      'commands',
      'commands list',
    ],
    type: CommandTypes.MODERATION,
    usage: 'commands',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  priority = -1;

  async run(context: Command.Context) {
    const guildId = <string> context.guildId;

    const {
      disabled_commands: disabledCommands,
    } = <GuildSettingsStored> await GuildSettingsStore.getOrFetch(context, guildId);

    const pages: Array<Array<RestResponses.GuildDisabledCommand>> = [];
    for (let i = 0; i < disabledCommands.length; i += ELEMENTS_PER_PAGE) {
      const page: Array<RestResponses.GuildDisabledCommand> = [];
      for (let disabledCommand of disabledCommands.slice(i, i + ELEMENTS_PER_PAGE)) {
        page.push(disabledCommand);
      }
      if (page.length) {
        pages.push(page);
      }
    }
    if (pages.length) {
      const pageLimit = pages.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (pageNumber) => {
          const embed = new Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);

          embed.setTitle('Disabled Commands');
          const footer = (pageLimit === 1) ? 'Disabled Commands List' : `Page ${pageNumber}/${pageLimit} of Disabled Commands List`;
          embed.setFooter(footer);

          const page = pages[pageNumber - 1];
          {
            const description: Array<string> = page.map((disabledCommand, i) => {
              let type = `Unknown (${disabledCommand.type})`;
              switch (disabledCommand.type) {
                case GuildDisableCommandsTypes.CHANNEL: {
                  type = `Channel Disable (<#${disabledCommand.id}>)`;
                }; break;
                case GuildDisableCommandsTypes.GUILD: {
                  type = 'Guild Disable';
                }; break;
                case GuildDisableCommandsTypes.ROLE: {
                  type = `Role Disable (<@&${disabledCommand.id}>)`;
                }; break;
                case GuildDisableCommandsTypes.USER: {
                  type = `User Disable (<@${disabledCommand.id}>)`;
                }; break;
              }
              const added = moment(disabledCommand.added).fromNow();
              return [
                `${(i * pageNumber) + 1}. **${disabledCommand.command}** added ${added}`,
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

      embed.setTitle('Disabled Commands');
      embed.setDescription('Currently no commands are disabled in this guild.');
      return context.editOrReply({embed});
    }
  }
}
