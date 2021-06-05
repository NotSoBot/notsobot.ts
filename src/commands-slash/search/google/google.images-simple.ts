import { Slash } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchGoogleImages } from '../../../api';
import { EmbedBrands, EmbedColors, GoogleLocales, GoogleLocalesText } from '../../../constants';
import { Paginator, Parameters, shuffleArray } from '../../../utils';

import { BaseCommandOption } from '../../basecommand';


export interface CommandArgs {
  locale?: GoogleLocales,
  query: string,
  randomize?: boolean,
  safe?: boolean,
}

export class SearchGoogleImagesSimpleCommand extends BaseCommandOption {
  description = 'Search Google Images';
  name = 'images-simple';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', required: true},
        {name: 'locale', description: 'Language for the Google Results', choices: Parameters.Slash.GOOGLE_LOCALES},
        {name: 'safe', type: Boolean, description: 'Safe Search'},
        {name: 'randomize', type: Boolean, description: 'Randomize the Image Results'},
      ],
    });
  }

  async run(context: Slash.SlashContext, args: CommandArgs) {
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
          if (args.locale && args.locale in GoogleLocalesText) {
            footer = `${footer} (${GoogleLocalesText[args.locale]})`;
          }
          embed.setFooter(footer, EmbedBrands.GOOGLE_GO);

          embed.setImage(result.imageUrl);
          if (result.image.isSVG) {
            embed.setDescription(Markup.url('**Image URL**', result.image.url));
          }

          return embed;
        },
      });
      return await paginator.start();
    }
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, 'Couldn\'t find any images for that search term');
  }
}
