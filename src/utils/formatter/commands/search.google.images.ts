import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchGoogleImages } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors, GoogleLocales, GoogleLocalesText } from '../../../constants';
import { Paginator, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.google.images';
export const COMMAND_ID_SIMPLE = 'search.google.images.simple';

export const RESULTS_PER_PAGE = 3;

export interface CommandArgs {
  locale?: GoogleLocales,
  query: string,
  randomize?: boolean,
  safe?: boolean,
  simple?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const results = await searchGoogleImages(context, args);
  if (results.length) {
    if (args.randomize) {
      shuffleArray(results);
    }
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        const result = results[page - 1];
        if (result.color) {
          embed.setColor(result.color);
        }

        let footer = translate('search_google_images.page_of_google_image_search_results', {page: page, pageLimit: pageLimit});
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
                details.push(translate('search_google_images.stars_reviews', {stars: product.stars, starsAmount: product.starsAmount.toLocaleString(language)}));
              } else {
                details.push(translate('search_google_images.stars', {stars: product.stars}));
              }
            }
            if (product.inStock !== null) {
              details.push((product.inStock) ? translate('search_google_images.in_stock') : translate('search_google_images.not_in_stock'));
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
                details.push(translate('search_google_images.stars_reviews', {stars: recipe.stars, starsAmount: recipe.starsAmount.toLocaleString(language)}));
              } else {
                details.push(translate('search_google_images.stars', {stars: recipe.stars}));
              }
            }
            if (recipe.duration) {
              details.push(recipe.duration);
            }
            if (recipe.servings) {
              details.push(translate('search_google_images.yields', {servings: recipe.servings}));
            }
            description.push(details.join(' · '));
            if (recipe.description) {
              description.push(Markup.escape.all(recipe.description));
            }
            if (recipe.ingredients.length) {
              embed.addField(translate('search_google_images.ingredients'), recipe.ingredients.join('\n'));
            }
          }
          if (result.metadata.video) {
            const { video } = result.metadata;

            const details: Array<string> = [];
            if (video.duration) {
              details.push(translate('search_google_images.duration', {duration: video.duration}));
            }
            if (video.likes !== null) {
              details.push(translate('search_google_images.likes', {likes: video.likes.toLocaleString(language)}));
            }
            if (video.views !== null) {
              details.push(translate('search_google_images.views', {views: video.views.toLocaleString(language)}));
            }
            description.push(details.join(' · '));
            if (video.uploadedAt) {
              let text = translate('search_google_images.uploaded', {uploadedAtText: video.uploadedAtText});
              if (video.channel) {
                text = translate('search_google_images.by', {channel: Markup.escape.all(video.channel), text: text});
              }
              description.push(text);
            } else {
              if (video.channel) {
                description.push(translate('search_google_images.uploaded_by', {channel: Markup.escape.all(video.channel)}));
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
  return editOrReply(context, translate('search_google_images.couldn_t_find_any_images_for_that'));
}
