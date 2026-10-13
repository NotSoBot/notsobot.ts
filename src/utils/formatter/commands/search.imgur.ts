import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionWebDetection, searchGoogleReverseImages } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, chunkArray, displayReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.imgur';

export const RESULTS_PER_PAGE = 3;


export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {

  return displayReply(context, {description: 'wip'});
}
