import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchDuckDuckGoImages, utilitiesFetchMedia } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import {
  Paginator,
  chunkArray,
  createUserEmbed,
  editOrReply,
  jobWaitForResult,
  shuffleArray,
} from '../../../utils';


export const COMMAND_ID = 'search.duckduckgo.images';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  randomize?: boolean,
  safe?: boolean,
  simple?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { results } = await searchDuckDuckGoImages(context, args);
  if (args.randomize) {
    shuffleArray(results);
  }

  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: async (page) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);
        embed.setFooter(`Page ${page}/${pageLimit} of Duck Duck Go Image Results`, EmbedBrands.DUCK_DUCK_GO);

        const result = results[page - 1];
        if (!args.simple) {
          embed.setTitle(`Found from ${result.footer}`);
          embed.setDescription(Markup.url(Markup.escape.all(result.header), result.url));
        }

        /*
        const job = await utilitiesFetchMedia(context, {
          doNotError: true,
          safe: args.safe,
          upload: false,
          url: result.proxy_url,
        }).then((response) => jobWaitForResult(context, response));
        if (job.result.response) {
          const { response } = job.result;
        }
        */

        const response = await utilitiesFetchMedia(context, {
          doNotError: true,
          safe: args.safe,
          upload: false,
          url: result.proxy_url,
        });
        if (response) {
          const filename = response.file.filename_safe;
          embed.setImage(`attachment://${filename}`);

          const value = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
          return [embed, [{filename, value}]];
        } else {
          const imageUrl = (result.image.extension === 'svg') ? result.thumbnail.url : result.proxy_url;
          embed.setImage(imageUrl);
          return embed;
        }
      },
    });
    return await paginator.start();
  }
  return editOrReply(context, 'Couldn\'t find any results for that search term');
}
