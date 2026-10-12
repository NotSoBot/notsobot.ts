import moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchRule34 } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.rule34';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
  randomize?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  return editOrReply(context, translate('search_rule34.sorry_this_command_has_been_disabled_at'));

  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const results = await searchRule34(context, args);
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
        embed.setFooter(`Page ${page}/${pageLimit} of https://rule34.xxx Results`, EmbedBrands.RULE34);

        embed.setTitle((result.is_video) ? translate('search_rule34.video_post') : translate('search_rule34.image_post'));
        embed.setUrl(result.url);

        const description: Array<string> = [];
        description.push(translate('search_rule34.uploaded', {moment: moment(result.created_at).locale(language).fromNow()}));
        description.push(translate('search_rule34.score', {score: result.score.toLocaleString(language)}));
        if (result.source) {
          if (result.source.startsWith('https://') || result.source.startsWith('http://')) {
            const cite = (result.source.split('://')[1] as string).split('/').shift() as string;
            description.push(translate('search_rule34.source', {cite: Markup.url(Markup.escape.all(cite), result.source)}));
          } else {
            description.push(translate('search_rule34.source_2', {source: result.source}));
          }
        }
        if (result.tags.length) {
          description.push(translate('search_rule34.tags', {tags: Markup.escape.all(result.tags.sort().join(', '))}));
        }
        {
          let text = description.join('\n');
          if (2048 < text.length) {
            text = text.slice(0, 2048);
            text = text.slice(0, text.lastIndexOf(','));
          }
          embed.setDescription(text);
        }

        let imageUrl: string;
        if (result.is_video) {
          imageUrl = result.thumbnail_url;
        } else {
          imageUrl = result.file_url;
        }
        embed.setImage(imageUrl);

        return embed;
      },
    });
    return await paginator.start();
  }

  return editOrReply(context, translate('search_rule34.couldn_t_find_any_images_for_that'));
}
