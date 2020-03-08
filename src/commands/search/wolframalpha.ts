import { Command, Utils } from 'detritus-client';

import { searchWolframAlpha } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, triggerTypingAfter } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export default class WebMDCommand extends BaseSearchCommand<CommandArgs> {
  aliases = ['wa'];
  name = 'wolframalpha';

  metadata = {
    description: 'Search Wolfram Alpha',
    examples: [
      'wolframalpha 5 plus 5',
    ],
    type: CommandTypes.SEARCH,
    usage: 'wolframalpha <query>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    await triggerTypingAfter(context);

    const { images, fields, url } = await searchWolframAlpha(context, args);
    if (images.length || fields.length) {
      const pageLimit = images.length || 1;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
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

          for (let field of fields) {
            embed.addField(field.name, field.value, true);
          }

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any results for that search term');
    }
  }
}
