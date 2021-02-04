import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchSteam } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, createUserEmbed, editOrReply } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
  steamId?: string,
}

export const COMMAND_NAME = 'steam';

export default class SteamCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'as', label: 'steamId'},
      ],
      metadata: {
        description: 'Search Steam Community for a user',
        examples: [
          `${COMMAND_NAME} Chocolate Coconut Cake`,
          `${COMMAND_NAME} NotSoSuper -as 76561198000146360`,
        ],
        type: CommandTypes.SEARCH,
        usage:  '<query>',
        // usage:  '<query> (-as <steam-id>)',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { count, results } = await searchSteam(context, args);

    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = createUserEmbed(context.user);
          embed.setColor(EmbedColors.DEFAULT);

          const result = results[page - 1];
          embed.setFooter(`Page ${page}/${pageLimit} of Steam Community Results (${count.toLocaleString()} Total Results)`, EmbedBrands.STEAM);
          embed.setThumbnail(result.avatar_url);

          embed.setTitle(result.username);
          embed.setUrl(result.url);

          {
            const description: Array<string> = [];

            if (result.real_name) {
              description.push(Markup.escape.all(result.real_name));
            }
            if (result.country) {
              description.push(`Located: ${result.country}`);
            }
            if (description.length) {
              description.push('');
            }

            if (result.past_names.length) {
              description.push(`Also known as ${result.past_names.map((name) => Markup.bold(Markup.codestring(name))).join(', ')}`);
            }
            if (result.in_common.length) {
              description.push(`${result.in_common.map((string) => Markup.bold(string)).join(' and ')} in common`);
            }
            if (result.custom_url) {
              description.push(`**Custom URL**: ${Markup.codestring(result.custom_url)}`);
            }
            if (result.steam_id) {
              description.push(`**ID**: ${Markup.codestring(result.steam_id)}`);
            }
            if (result.steam_id_64) {
              description.push(`**ID64**: ${Markup.codestring(result.steam_id_64)}`);
            }

            if (description.length) {
              embed.setDescription(description.join('\n'));
            }
          }

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return editOrReply(context, 'Couldn\'t find any steam accounts matching that search term');
    }
  }
}
