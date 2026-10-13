import moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchRule34Paheal } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, Paginator, chunkArray, displayReply, shuffleArray } from '../../../utils';


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
  const { language, translate, translateMaybe } = await getTranslator(context);
  return displayReply(context, {description: translate('search_rule34_paheal.sorry_this_command_has_been_disabled_at')});


  const results = await searchRule34Paheal(context, args);
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
        payload.footer = translate('search_rule34_paheal.page_of_paheal_rule34_results', {page: page, pageLimit: pageLimit});
        payload.footerIconUrl = EmbedBrands.RULE34_PAHEAL;

        payload.title = (result.is_video) ? translate('search_rule34_paheal.video', {file_name: result.file_name}) : result.file_name;
        payload.url = result.url;

        const description: Array<string> = [];
        if (result.author) {
          description.push(translate('search_rule34_paheal.created_by', {author: Markup.url(Markup.escape.all(result.author.id), result.author.url)}));
        }
        description.push(translate('search_rule34_paheal.uploaded', {moment: moment(result.created_at).locale(language).fromNow()}));
        description.push(translate('search_rule34_paheal.score', {score: result.score.toLocaleString(language)}));
        if (result.source) {
          if (result.source.startsWith('https://') || result.source.startsWith('http://')) {
            description.push(`${Markup.url('**Source**', result.source)}`);
          } else {
            description.push(translate('search_rule34_paheal.source', {source: result.source}));
          }
        }
        if (result.tags.length) {
          description.push(translate('search_rule34_paheal.tags', {tags: Markup.escape.all(result.tags.sort().join(', '))}));
        }
        payload.description = description.join('\n');

        let imageUrl: string;
        if (result.is_video) {
          imageUrl = result.thumbnail_url;
        } else {
          imageUrl = result.file_url;
        }
        // https is broken for these for some reason
        payload.image = imageUrl.replace('https://', 'http://');

        return {display: payload};
      },
    });
    return await paginator.start();
  }

  return displayReply(context, {description: translate('search_rule34_paheal.couldn_t_find_any_images_for_that')});
}
