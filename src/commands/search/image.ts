import * as moment from 'moment';

import { Command, CommandClient, Utils } from 'detritus-client';
const { Markup } = Utils;

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
          const embed = new Utils.Embed();
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
            const product = result.product;

            const productDetails: Array<string> = [];
            if (product.stars) {
              if (product.stars_amount) {
                productDetails.push(`${product.stars} ⭐ (${product.stars_amount} reviews)`);
              } else {
                productDetails.push(`${product.stars} ⭐`);
              }
            }
            if (product.in_stock !== null) {
              productDetails.push((product.in_stock) ? 'In Stock' : 'Not In Stock');
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
            const video = result.video;

            const videoDetails: Array<string> = [];
            if (video.duration) {
              videoDetails.push(video.duration);
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
              if (video.uploaded_at) {
                text = `${text} (${moment(video.uploaded_at).fromNow()})`;
              }
              description.push(text);
            } else {
              if (video.uploaded_at) {
                description.push(`Uploaded ${moment(video.uploaded_at).fromNow()}`);
              }
            }
            if (video.description) {
              if (video.type === GoogleImageVideoTypes.YOUTUBE) {
                // just a spacer
                description.push('');
              }
              description.push(Markup.escape.all(video.description));
            }
          }

          if (result.image.extension === 'svg') {
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
