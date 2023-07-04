import moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchRule34Paheal } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.rule34.paheal';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  randomize?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const results = await searchRule34Paheal(context, args);
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
        embed.setFooter(`Page ${page}/${pageLimit} of Paheal Rule34 Results`, EmbedBrands.RULE34_PAHEAL);

        embed.setTitle((result.is_video) ? `${result.file_name} (Video)` : result.file_name);
        embed.setUrl(result.url);

        const description: Array<string> = [];
        if (result.author) {
          description.push(`Created by ${Markup.url(Markup.escape.all(result.author.id), result.author.url)}`);
        }
        description.push(`Uploaded ${moment(result.created_at).fromNow()}`);
        description.push(`**Score**: ${result.score.toLocaleString()}`);
        if (result.source) {
          if (result.source.startsWith('https://') || result.source.startsWith('http://')) {
            description.push(`${Markup.url('**Source**', result.source)}`);
          } else {
            description.push(`**Source**: ${result.source}`);
          }
        }
        if (result.tags.length) {
          description.push(`**Tags**: ${Markup.escape.all(result.tags.sort().join(', '))}`);
        }
        embed.setDescription(description.join('\n'));

        let imageUrl: string;
        if (result.is_video) {
          imageUrl = result.thumbnail_url;
        } else {
          imageUrl = result.file_url;
        }
        // https is broken for these for some reason
        embed.setImage(imageUrl.replace('https://', 'http://'));

        return embed;
      },
    });
    return await paginator.start();
  }

  return editOrReply(context, 'Couldn\'t find any images for that search term');
}
