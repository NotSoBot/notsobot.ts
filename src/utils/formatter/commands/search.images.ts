import { Command, Interaction } from 'detritus-client';

import { createMessage as createMessageDuckDuckGoImages } from './search.duckduckgo.images';
import { createMessage as createMessageGoogleImages } from './search.google.images';


export const COMMAND_ID = 'search.images';
export const COMMAND_ID_SIMPLE = 'search.images.simple';

export const RESULTS_PER_PAGE = 3;

export interface CommandArgs {
  query: string,
  randomize?: boolean,
  safe?: boolean,
  simple?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  //return await createMessageGoogleImages(context, args);
  return await createMessageDuckDuckGoImages(context, args);
}
