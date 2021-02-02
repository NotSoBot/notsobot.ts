import { Command, CommandClient } from 'detritus-client';

import { searchUrbanRandom } from '../../api';
import { CommandTypes, EmbedBrands } from '../../constants';
import { Paginator, editOrReply } from '../../utils';

import { BaseSearchCommand } from '../basecommand';

import { createEmbed } from './urban';


export const COMMAND_NAME = 'urban random';

export default class UrbanRandomCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Search for random Urban Dictionary definitions',
        examples: [
          COMMAND_NAME,
        ],
        type: CommandTypes.SEARCH,
        usage: COMMAND_NAME,
      },
    });
  }

  async run(context: Command.Context) {
    const results = await searchUrbanRandom(context);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = createEmbed(context, results[page - 1]);
          embed.setFooter(`Page ${page}/${pageLimit} of Urban Dictionary Results`, EmbedBrands.URBAN);

          return embed;
        },
      });
      return await paginator.start();
    }
    return editOrReply(context, 'Couldn\'t find any definitions for that search term');
  }
}
