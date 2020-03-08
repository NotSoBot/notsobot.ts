import * as moment from 'moment';

import { Command, Utils } from 'detritus-client';
const { Embed, Markup } = Utils;

import { searchE621 } from '../../api';
import { CommandTypes, E621Rating, E621RatingText, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, triggerTypingAfter } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


const VIDEO_EXTENSIONS = ['swf', 'webm'];

export interface CommandArgsBefore {
  query: string,
}

export interface CommandArgs {
  query: string,
}

export default class E621Command extends BaseSearchCommand<CommandArgs> {
  name = 'e621';

  metadata = {
    description: 'Search e621, a furry porn imageboard',
    examples: [
      'e621 discord',
    ],
    type: CommandTypes.SEARCH,
    usage: 'e621 <query>',
  };
  nsfw = true;

  async run(context: Command.Context, args: CommandArgs) {
    await triggerTypingAfter(context);

    const results = await searchE621(context, args);
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
          embed.setFooter(`Page ${page}/${pageLimit} of https://e621.net Results`);


          const isVideo = VIDEO_EXTENSIONS.includes(result.file.ext);
          embed.setTitle((isVideo) ? 'Video Post' : 'Image Post');
          embed.setUrl(result.url);

          const description: Array<string> = [];
          if (!result.file.url) {
            description.push('**Unable to show thumbnail due to needing to be logged in to view.**');
          }
          if (!result.updated_at || result.created_at === result.updated_at) {
            description.push(`Uploaded ${moment(result.created_at).fromNow()}`);
          } else {
            description.push(`Uploaded ${moment(result.created_at).fromNow()} (Edited ${moment(result.updated_at).fromNow()})`);
          }

          if (result.tags.artist.length) {
            const title = (result.tags.artist.length === 1) ? 'Artist' : 'Artists';
            description.push(`**${title}**: ${result.tags.artist.sort().join(', ')}`);
          }

          description.push(`**Comments**: ${result.comment_count.toLocaleString()}`);
          description.push(`**Favorites**: ${result.fav_count.toLocaleString()}`);

          {
            const rating = (result.rating in E621RatingText) ? (<any> E621RatingText)[result.rating] : `Unknown Rating (${result.rating})`;
            description.push(`**Rating**: ${rating}`);
          }

          description.push(`**Score**: ${result.score.total.toLocaleString()}`);

          if (result.sources.length) {
            const title = (result.sources.length === 1) ? 'Source' : 'Sources';
            description.push(`**${title}**: ${result.sources.sort().join(', ')}`);
          }

          description.push('');

          if (result.tags.character.length) {
            description.push(`**Characters**: ${Markup.escape.all(result.tags.character.sort().join(', '))}`);
          }

          if (result.tags.species.length) {
            description.push(`**Species**: ${Markup.escape.all(result.tags.species.sort().join(', '))}`);
          }

          if (result.tags.general.length) {
            description.push(`**Tags**: ${Markup.escape.all(result.tags.general.sort().join(', '))}`);
          }
          embed.setDescription(description.join('\n'));

          if (isVideo) {
            embed.setImage(result.preview.url);
          } else {
            embed.setImage(result.file.url);
          }
          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any images for that search term');
    }
  }
}
