import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchGoogleImages } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors, GoogleImageVideoTypes, GoogleLocales, GoogleLocalesText } from '../../constants';
import { Arguments, Paginator, createUserEmbed, editOrReply } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  locale: GoogleLocales,
  query: string,
  safe: boolean,
}

export const COMMAND_NAME = 'image';

export default class ImageCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['g image', 'g img', 'google image', 'google img', 'img'],
      args: [
        Arguments.GoogleLocale,
        Arguments.Safe,
      ],
      metadata: {
        description: 'Search Google Images',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -locale russian`,
          `${COMMAND_NAME} something nsfw -safe`,
        ],
        type: CommandTypes.SEARCH,
        usage: `${COMMAND_NAME} <query> (-locale <language>) (-safe)`,
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const results = await searchGoogleImages(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = createUserEmbed(context.user);
          embed.setColor(EmbedColors.DEFAULT);

          const result = results[page - 1];
          if (result.color) {
            embed.setColor(result.color);
          }
          if (result.header) {
            embed.setTitle(`${result.header} (${result.footer})`);
          } else {
            embed.setTitle(result.footer);
          }

          let footer = `Page ${page}/${pageLimit} of Google Image Search Results`;
          if (args.locale in GoogleLocalesText) {
            footer = `${footer} (${GoogleLocalesText[args.locale]})`;
          }
          embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

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
            embed.setImage(result.thumbnail.url);
            description.push(Markup.url('**Image URL**', result.image.url));
          } else {
            embed.setImage(result.image.url);
          }

          embed.setDescription(description.join('\n'));

          return embed;
        },
      });
      return await paginator.start();
    }
    return editOrReply(context, 'Couldn\'t find any images for that search term');
  }
}
