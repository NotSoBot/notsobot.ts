import { Command, Interaction } from 'detritus-client';

import { UserSettingsSearchProviders } from '../../../constants';
import { getSearchProvider } from '../../../utils';

import { createMessage as createMessageBing } from './search.bing';
import { createMessage as createMessageDuckDuckGo } from './search.duckduckgo';
import { createMessage as createMessageGoogleWeb } from './search.google.web';
import { createMessage as createMessageYandex } from './search.yandex';


export const COMMAND_ID = 'search.web';

export interface CommandArgs {
  query: string,
  randomize?: boolean,
}

// uses the user's search provider, then the server's, then DuckDuckGo
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { provider } = await getSearchProvider(context, 'web');
  switch (provider) {
    case UserSettingsSearchProviders.BING: return await createMessageBing(context, args);
    case UserSettingsSearchProviders.GOOGLE: return await createMessageGoogleWeb(context, args);
    case UserSettingsSearchProviders.YANDEX: return await createMessageYandex(context, args);
  }
  return await createMessageDuckDuckGo(context, args);
}
