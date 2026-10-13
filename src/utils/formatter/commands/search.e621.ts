import moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchE621 } from '../../../api';
import { getTranslator } from '../../i18n';
import { E621Rating, E621RatingText, EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, Paginator, chunkArray, displayReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.e621';


export interface CommandArgs {
  query: string,
  randomize?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  return displayReply(context, {description: translate('search_e621.sorry_this_command_has_been_disabled_at')});


  const results = await searchE621(context, args);
  if (results.length) {
    if (args.randomize) {
      shuffleArray(results);
    }
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;

        const result = results[page - 1];
        if (result.header) {
          payload.title = `${result.header} (${result.footer})`;
        } else {
          payload.title = result.footer;
        }
        payload.footer = `Page ${page}/${pageLimit} of https://e621.net Results`;
        payload.footerIconUrl = EmbedBrands.E621;

        payload.title = (result.is_video) ? translate('search_e621.video_post') : translate('search_e621.image_post');
        payload.url = result.url;

        const description: Array<string> = [];
        if (!result.file.url) {
          description.push(translate('search_e621.unable_to_show_thumbnail_due_to_needing'));
        }
        if (!result.updated_at || result.created_at === result.updated_at) {
          description.push(translate('search_e621.uploaded', {moment: moment(result.created_at).locale(language).fromNow()}));
        } else {
          description.push(translate('search_e621.uploaded_edited', {moment: moment(result.created_at).locale(language).fromNow(), moment2: moment(result.updated_at).locale(language).fromNow()}));
        }

        if (result.tags.artist.length) {
          const title = (result.tags.artist.length === 1) ? translate('search_e621.artist') : translate('search_e621.artists');
          description.push(`**${title}**: ${result.tags.artist.sort().join(', ')}`);
        }

        description.push(translate('search_e621.comments', {comment_count: result.comment_count.toLocaleString(language)}));
        description.push(translate('search_e621.favorites', {fav_count: result.fav_count.toLocaleString(language)}));

        {
          const rating = (result.rating in E621RatingText) ? (<any> E621RatingText)[result.rating] : translate('search_e621.unknown_rating', {rating: result.rating});
          description.push(translate('search_e621.rating', {rating: rating}));
        }

        description.push(translate('search_e621.score', {total: result.score.total.toLocaleString(language)}));

        if (result.sources.length) {
          const title = (result.sources.length === 1) ? translate('search_e621.source') : translate('search_e621.sources');
          description.push(`**${title}**: ${result.sources.sort().join(', ')}`);
        }

        description.push('');

        if (result.tags.character.length) {
          description.push(translate('search_e621.characters', {character: Markup.escape.all(result.tags.character.sort().join(', '))}));
        }

        if (result.tags.species.length) {
          description.push(translate('search_e621.species', {species: Markup.escape.all(result.tags.species.sort().join(', '))}));
        }

        if (result.tags.general.length) {
          description.push(translate('search_e621.tags', {general: Markup.escape.all(result.tags.general.sort().join(', '))}));
        }
        payload.description = description.join('\n');

        if (result.is_video) {
          payload.image = result.preview.url;
        } else {
          payload.image = result.file.url;
        }
        return {display: payload};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_e621.couldn_t_find_any_images_for_that')});
}
