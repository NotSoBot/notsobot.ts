import { Command, CommandClient } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchGoogleImages } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors, GoogleLocales, GoogleLocalesText } from '../../constants';
import { Arguments, Paginator, editOrReply, shuffleArray } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  locale: GoogleLocales,
  query: string,
  randomize: boolean,
  safe: boolean,
}

export const COMMAND_NAME = 'image2';

export default class Image2Command extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['g image2', 'g img2', 'google image2', 'google img2', 'img2'],
      args: [
        Arguments.GoogleLocale,
        Arguments.Safe,
        {aliases: ['r', 'random'], name: 'randomize', type: Boolean},
      ],
      metadata: {
        description: 'Search Google Images, but with less data displayed',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -locale russian`,
          `${COMMAND_NAME} something nsfw -safe`,
          `${COMMAND_NAME} notsobot -randomize`,
          `${COMMAND_NAME} notsobot -r`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query> (-locale <language>) (-randomize) (-safe)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const results = await searchGoogleImages(context, args);
    if (results.length) {
      if (args.randomize) {
        shuffleArray(results);
      }
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = new Embed();
          embed.setColor(EmbedColors.DEFAULT);

          const result = results[page - 1];
          if (result.color) {
            embed.setColor(result.color);
          }

          let footer = `Page ${page}/${pageLimit} of Google Image Search Results`;
          if (args.locale in GoogleLocalesText) {
            footer = `${footer} (${GoogleLocalesText[args.locale]})`;
          }
          embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

          if (result.image.isSVG) {
            embed.setImage(result.thumbnail.url);
            embed.setDescription(Markup.url('**Image URL**', result.image.url));
          } else {
            embed.setImage(result.image.url);
          }

          return embed;
        },
      });
      return await paginator.start();
    }
    return editOrReply(context, 'Couldn\'t find any images for that search term');
  }
}
