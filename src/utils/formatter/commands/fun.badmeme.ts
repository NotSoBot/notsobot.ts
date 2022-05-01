import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import { searchImgur } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { DiscordEmojis, EmbedBrands, EmbedColors } from '../../../constants';
import { DefaultParameters, Paginator, createUserEmbed, editOrReply, shuffleArray } from '../..';


export const COMMAND_ID = 'fun.badmeme';

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
    embed.setColor(EmbedColors.DARK_MESSAGE_BACKGROUND);
    embed.setImage(results[0].thumbnail);

    const url = results[0].thumbnail;
    const filename = url.split('/').pop()!;
    embed.setImage(`attachment://${filename}`);
    return editOrReply(context, {
      embed,
      file: {filename, value: await context.rest.get(url)},
    });
  }
  return editOrReply(context, 'Couldn\'t find any bad memes');
}
