import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import { searchImgur } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { DiscordEmojis, EmbedBrands, EmbedColors } from '../../../constants';
import { DefaultParameters, Paginator, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.badmeme';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const results = shuffleArray<RestResponsesRaw.SearchImgurResult>(await searchImgur(context, {query: 'meme'}));
  if (results.length) {
    const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setThumbnail(results[0].thumbnail);
    return editOrReply(context, {embed});
  }
  return editOrReply(context, 'Couldn\'t find any bad memes');
}
