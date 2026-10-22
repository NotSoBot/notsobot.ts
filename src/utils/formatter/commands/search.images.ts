import { Command, Interaction } from 'detritus-client';

import { UserSettingsSearchProviders } from '../../../constants';
import { getSearchProvider } from '../../../utils';

import { createMessage as createMessageBingImages } from './search.bing.images';
import { createMessage as createMessageDuckDuckGoImages } from './search.duckduckgo.images';
import { createMessage as createMessageGoogleImages } from './search.google.images';
import { createMessage as createMessageYandexImages } from './search.yandex.images';


export const COMMAND_ID = 'search.images';
export const COMMAND_ID_SIMPLE = 'search.images.simple';

export const RESULTS_PER_PAGE = 3;

export interface CommandArgs {
  query: string,
  randomize?: boolean,
  simple?: boolean,
}

// uses the user's search provider, then the server's, then Google
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { provider } = await getSearchProvider(context, 'images');
  switch (provider) {
    case UserSettingsSearchProviders.BING: return await createMessageBingImages(context, args);
    case UserSettingsSearchProviders.DUCK_DUCK_GO: return await createMessageDuckDuckGoImages(context, args);
    case UserSettingsSearchProviders.YANDEX: return await createMessageYandexImages(context, args);
  }
  return await createMessageGoogleImages(context, args);
}
