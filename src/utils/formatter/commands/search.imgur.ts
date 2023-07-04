import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { googleContentVisionWebDetection, searchGoogleReverseImages } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.imgur';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  return editOrReply(context, 'wip');
}
