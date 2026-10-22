import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { Translator, getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { SearchProvidersText, UserSettingsSearchProviders } from '../../../constants';
import { SearchProviderKind, SearchProviderSources, displayReply, getSearchProvider } from '../../../utils';


export const COMMAND_ID = 'settings.set.search.provider';

export type SearchProviderClear = 'all' | SearchProviderKind;

export interface CommandArgs {
  clear?: SearchProviderClear,
  images?: UserSettingsSearchProviders,
  web?: UserSettingsSearchProviders,
}

export const SEARCH_PROVIDER_KINDS: Array<SearchProviderKind> = ['web', 'images'];

// `{web: Bing}` with `clear: 'images'` -> `{searchProviderImages: null, searchProviderWeb: Bing}`, nothing set is left out
export function toSearchProviderEdits(args: CommandArgs) {
  const edits: {searchProviderImages?: UserSettingsSearchProviders | null, searchProviderWeb?: UserSettingsSearchProviders | null} = {};
  if (args.images !== undefined) {
    edits.searchProviderImages = args.images;
  }
  if (args.web !== undefined) {
    edits.searchProviderWeb = args.web;
  }
  if (args.clear === 'all' || args.clear === 'images') {
    edits.searchProviderImages = null;
  }
  if (args.clear === 'all' || args.clear === 'web') {
    edits.searchProviderWeb = null;
  }
  return edits;
}

export function formatSearchProvider(
  translate: Translator['translate'],
  kind: SearchProviderKind,
  provider: UserSettingsSearchProviders,
  source: SearchProviderSources,
): string {
  const text = translate((kind === 'images') ? 'settings_set_search_provider.images' : 'settings_set_search_provider.web', {
    provider: Markup.bold(SearchProvidersText[provider]),
  });
  let sourceText: string;
  switch (source) {
    case SearchProviderSources.SERVER: sourceText = translate('settings_set_search_provider.source_server'); break;
    case SearchProviderSources.USER: sourceText = translate('settings_set_search_provider.source_user'); break;
    default: sourceText = translate('settings_set_search_provider.source_default');
  }
  return `${text} (${sourceText})`;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  const edits = toSearchProviderEdits(args);
  const isEditing = !!Object.keys(edits).length;
  if (isEditing) {
    const settings = await editUserSettings(context, context.userId, edits);
    UserSettingsStore.insert(context.userId, settings);
  }

  const lines: Array<string> = [];
  for (let kind of SEARCH_PROVIDER_KINDS) {
    const { provider, source } = await getSearchProvider(context, kind);
    lines.push(formatSearchProvider(translate, kind, provider, source));
  }

  return displayReply(context, {
    description: lines.join('\n'),
    ephemeral: true,
    title: translate((isEditing) ? 'settings_set_search_provider.title_updated' : 'settings_set_search_provider.title'),
  });
}
