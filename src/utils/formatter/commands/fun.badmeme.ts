import { Command, Interaction } from 'detritus-client';

import { searchImgur } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import { DefaultParameters, createPaginatorMediaCache, displayReply, shuffleArray } from '../..';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'fun.badmeme';

// how many memes to try before giving up when they fail to download or get flagged by the safety scan
export const MAX_ATTEMPTS = 3;

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { results } = await searchImgur(context, {query: 'meme'});
  // the api leaves `thumbnail` null when imgur's page didn't have one
  const shuffled = shuffleArray<RestResponsesRaw.SearchImgurResult>(results.filter((result) => !!result.thumbnail));

  // downloaded and safety scanned through the api instead of fetching imgur directly
  const fetchMedia = createPaginatorMediaCache(context, {safe: DefaultParameters.safe(context)});
  for (let [index, result] of shuffled.slice(0, MAX_ATTEMPTS).entries()) {
    try {
      const file = await fetchMedia(index, result.thumbnail!);
      return displayReply(context, {
        color: EmbedColors.DARK_MESSAGE_BACKGROUND,
        files: [file],
        image: `attachment://${file.filename}`,
      });
    } catch(error) {
      // try the next one
    }
  }

  const { translate } = await getTranslator(context);
  return displayReply(context, {description: translate('fun.badmeme.not_found')});
}
