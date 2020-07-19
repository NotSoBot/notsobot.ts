import { Command, CommandClient } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { googleSearchImages } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors, GoogleImageVideoTypes, GoogleLocales, GoogleLocalesText } from '../../constants';
import { Arguments, Paginator, triggerTypingAfter } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  locale: GoogleLocales,
  query: string,
  safe: boolean,
}

export default class ImageCommand extends BaseSearchCommand<CommandArgs> {
  aliases = ['img'];
  name = 'image';

  metadata = {
    description: 'Search Google Images',
    examples: [
      'image notsobot',
      'image notsobot -locale russian',
      'image something nsfw -safe',
    ],
    type: CommandTypes.SEARCH,
    usage: 'image <query> (-locale <language>) (-safe)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [Arguments.GoogleLocale, Arguments.Safe],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    await triggerTypingAfter(context);

    const results = await googleSearchImages(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = new Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);

          const result = results[page - 1];
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
          if (result.product) {
            const { product } = result;

            const productDetails: Array<string> = [];
            if (product.stars) {
              if (product.starsAmount) {
                productDetails.push(`${product.stars} ⭐ (${product.starsAmount.toLocaleString()} reviews)`);
              } else {
                productDetails.push(`${product.stars} ⭐`);
              }
            }
            if (product.inStock !== null) {
              productDetails.push((product.inStock) ? 'In Stock' : 'Not In Stock');
            }
            if (product.price) {
              productDetails.push(`${product.price} (${product.currency})`);
            }
            description.push(productDetails.join(' | '));
            if (product.description) {
              description.push(Markup.escape.all(product.description));
            }
          }
          if (result.video) {
            const { video } = result;

            const videoDetails: Array<string> = [];
            if (video.duration) {
              if (video.type === GoogleImageVideoTypes.YOUTUBE) {
                videoDetails.push(video.duration);
              } else {
                videoDetails.push(`${video.duration} Duration`);
              }
            }
            if (video.likes) {
              videoDetails.push(`${video.likes} Likes`);
            }
            if (video.views !== null) {
              videoDetails.push(`${video.views.toLocaleString()} Views`);
            }
            description.push(videoDetails.join(' | '));
            if (video.channel) {
              let text = `Uploaded By **${Markup.escape.all(video.channel)}**`;
              if (video.uploadedAt) {
                text = `${text} (${video.uploadedAtText})`;
              }
              description.push(text);
            } else {
              if (video.uploadedAt) {
                description.push(`Uploaded ${video.uploadedAtText}`);
              }
            }
            if (video.description) {
              if (videoDetails.length) {
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
    } else {
      return context.editOrReply('Couldn\'t find any images for that search term');
    }
  }
}
