import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchWolframAlpha } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.wolframalpha';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { images, fields, url } = await searchWolframAlpha(context, args);
  if (images.length || fields.length) {
    const pageLimit = images.length || 1;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
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

        for (let field of fields.slice(0, 25)) {
          embed.addField(field.name, field.value, true);
        }

        return embed;
      },
    });
    return await paginator.start();
  }

  return editOrReply(context, 'Couldn\'t find any results for that search term');
}
