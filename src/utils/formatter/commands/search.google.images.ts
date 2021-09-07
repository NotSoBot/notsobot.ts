import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchGoogleImages } from '../../../api';
import { EmbedBrands, EmbedColors, GoogleLocales, GoogleLocalesText } from '../../../constants';
import { Paginator, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const RESULTS_PER_PAGE = 3;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: {locale?: GoogleLocales, query: string, randomize?: boolean, safe?: boolean, simple?: boolean},
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const results = await searchGoogleImages(context, args);
  if (results.length) {
    if (args.randomize) {
      shuffleArray(results);
    }
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      isEphemeral: true,
      onPage: (page) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        const result = results[page - 1];
        if (result.color) {
          embed.setColor(result.color);
        }

        let footer = `Page ${page}/${pageLimit} of Google Image Search Results`;
        if (args.locale && args.locale in GoogleLocalesText) {
          footer = `${footer} (${GoogleLocalesText[args.locale]})`;
        }
        embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

        if (!args.simple) {
          if (result.header) {
            embed.setTitle(`${result.header} (${result.footer})`);
          } else {
            embed.setTitle(result.footer);
          }

          const description: Array<string> = [Markup.url(Markup.escape.all(result.description), result.url)];
          if (result.metadata.product) {
            const { product } = result.metadata;

            const details: Array<string> = [];
            if (product.stars) {
              if (product.starsAmount) {
                details.push(`${product.stars} Stars (${product.starsAmount.toLocaleString()} reviews)`);
              } else {
                details.push(`${product.stars} Stars`);
              }
            }
            if (product.inStock !== null) {
              details.push((product.inStock) ? 'In Stock' : 'Not In Stock');
            }
            if (product.price) {
              details.push(`${product.price} (${product.currency})`);
            }
            description.push(details.join(' · '));
            if (product.description) {
              description.push(Markup.escape.all(product.description));
            }
          }
          if (result.metadata.recipe) {
            const { recipe } = result.metadata;

            const details: Array<string> = [];
            if (recipe.stars) {
              if (recipe.starsAmount) {
                details.push(`${recipe.stars} Stars (${recipe.starsAmount.toLocaleString()} reviews)`);
              } else {
                details.push(`${recipe.stars} Stars`);
              }
            }
            if (recipe.duration) {
              details.push(recipe.duration);
            }
            if (recipe.servings) {
              details.push(`Yields: ${recipe.servings}`);
            }
            description.push(details.join(' · '));
            if (recipe.description) {
              description.push(Markup.escape.all(recipe.description));
            }
            if (recipe.ingredients.length) {
              embed.addField('Ingredients', recipe.ingredients.join('\n'));
            }
          }
          if (result.metadata.video) {
            const { video } = result.metadata;

            const details: Array<string> = [];
            if (video.duration) {
              details.push(`${video.duration} Duration`);
            }
            if (video.likes !== null) {
              details.push(`${video.likes.toLocaleString()} Likes`);
            }
            if (video.views !== null) {
              details.push(`${video.views.toLocaleString()} Views`);
            }
            description.push(details.join(' · '));
            if (video.uploadedAt) {
              let text = `Uploaded ${video.uploadedAtText}`;
              if (video.channel) {
                text = `${text} by **${Markup.escape.all(video.channel)}**`;
              }
              description.push(text);
            } else {
              if (video.channel) {
                description.push(`Uploaded by **${Markup.escape.all(video.channel)}**`);
              }
            }
            if (video.description) {
              if (details.length) {
                // just a spacer
                description.push('');
              }
              description.push(Markup.escape.all(video.description));
            }
          }

          if (result.image.isSVG) {
            description.push(Markup.url('**Image URL**', result.image.url));
          }

          embed.setDescription(description.join('\n'));
        }

        embed.setImage(result.imageUrl);

        return embed;
      },
    });
    return await paginator.start();
  }
  return editOrReply(context, 'Couldn\'t find any images for that search term');
}
