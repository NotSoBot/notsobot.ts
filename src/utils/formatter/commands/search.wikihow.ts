import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchWikihow, searchWikihowRandom } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.wikihow';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  random: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  if (args.random) {
    // have steps
    const result = await searchWikihowRandom(context);
    if (result.methods.length) {
      const [ method ] = result.methods;
      if (method.steps.length) {
        const pageLimit = method.steps.length;
        const paginator = new Paginator(context, {
          pageLimit,
          onPage: (page) => {
            const step = method.steps[page - 1];

            const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
            embed.setColor(EmbedColors.DEFAULT);
            embed.setTitle(result.title);

            embed.setImage(step.image);
            embed.setUrl(step.url);

            {
              const description: Array<string> = [];

              {
                const { rating } = result;
                description.push(`Rating: ${rating.value}% (${rating.count.toLocaleString()} Votes)`);
              }

              if (result.video) {
                description.push(Markup.url('Video', result.video.url));
              }

              embed.setDescription(description.join('\n'));
            }

            embed.addField(`**Method 1: ${Markup.escape.all(method.title)}**`, `**Step ${page}:** ${Markup.escape.all(step.text, {limit: 1000})}`);

            embed.setFooter(`Step ${page}/${pageLimit} of ${method.title}`, EmbedBrands.NOTSOBOT);

            return embed;
          },
        });
        return await paginator.start();
      }
    }
    return editOrReply(context, '/shrug');
  }

  const results = await searchWikihow(context, args);
  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const result = results[page - 1];

        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);
        embed.setTitle(result.title);
        embed.setUrl(result.url);

        if (result.thumbnail) {
          embed.setImage(result.thumbnail);
        }

        {
          const description: Array<string> = [];
          description.push(`Last updated ${result.updated}`);
          description.push(`${result.views.toLocaleString()} Views`);
          if (result.badge) {
            description.push(`Badge: ${result.badge}`);
          }
          embed.setDescription(description.join('\n'));
        }

        embed.setFooter(`Page ${page}/${pageLimit} of Wikihow Results`, EmbedBrands.WIKIHOW);

        return embed;
      },
    });
    return await paginator.start();
  }

  return editOrReply(context, 'Couldn\'t find any guides for that search');
}
