import { Command, CommandClient } from 'detritus-client';

import { searchWolframAlpha } from '../../../api';
import { CommandCategories, EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, createUserEmbed, editOrReply } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export const COMMAND_NAME = 'wolframalpha';

export default class WebMDCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['wa'],
      metadata: {
        description: 'Search Wolfram Alpha',
        examples: [
          `${COMMAND_NAME} 5 plus 5`,
        ],
        category: CommandCategories.SEARCH,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { images, fields, url } = await searchWolframAlpha(context, args);
    if (images.length || fields.length) {
      const pageLimit = images.length || 1;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = createUserEmbed(context.user);
          embed.setColor(EmbedColors.DEFAULT);
          embed.setTitle('Wolfram Alpha Results');
          embed.setUrl(url);

          embed.setThumbnail(EmbedBrands.WOLFRAM_ALPHA);
          if (pageLimit === 1) {
            embed.setFooter('Wolfram Results', EmbedBrands.WOLFRAM_ALPHA);
          } else {
            embed.setFooter(`Image ${page}/${pageLimit} of Wolfram Results`, EmbedBrands.WOLFRAM_ALPHA);
          }

          const image = images[page - 1];
          if (image) {
            embed.setImage(image);
          }

          for (let field of fields) {
            embed.addField(field.name, field.value, true);
          }

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return editOrReply(context, 'Couldn\'t find any results for that search term');
    }
  }
}
