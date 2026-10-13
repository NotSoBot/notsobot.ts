import { Command, Interaction } from 'detritus-client';

import { searchImgur } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import { displayReply, shuffleArray } from '../..';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'fun.badmeme';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { results } = await searchImgur(context, {query: 'meme'});
  const shuffled = shuffleArray<RestResponsesRaw.SearchImgurResult>(results);
  if (shuffled.length) {
    const url = shuffled[0].thumbnail;
    const filename = url.split('/').pop()!;
    return displayReply(context, {
      color: EmbedColors.DARK_MESSAGE_BACKGROUND,
      files: [{filename, value: await context.rest.get(url)}],
      image: `attachment://${filename}`,
    });
  }
  const { translate } = await getTranslator(context);
  return displayReply(context, {description: translate('fun.badmeme.not_found')});
}
