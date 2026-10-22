import { Command, Interaction } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { getTranslator } from '../../i18n';

import { editGuildSettings } from '../../../api';
import { SEARCH_PROVIDER_IMAGES_DEFAULT, SEARCH_PROVIDER_WEB_DEFAULT } from '../../../constants';
import { SearchProviderSources, displayReply } from '../../../utils';

import {
  CommandArgs as SettingsSetSearchProviderArgs,
  SEARCH_PROVIDER_KINDS,
  formatSearchProvider,
  toSearchProviderEdits,
} from './settings.set.search.provider';


export const COMMAND_ID = 'server.set.search.provider';

export type CommandArgs = SettingsSetSearchProviderArgs;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  const edits = toSearchProviderEdits(args);
  const isEditing = !!Object.keys(edits).length;

  let settings;
  if (isEditing) {
    ({ settings } = await editGuildSettings(context, context.guildId!, edits));
  } else {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (!guildSettings) {
      return displayReply(context, {
        description: translate('settings_server_set_search_provider.error_fetching'),
        ephemeral: true,
      });
    }
    settings = guildSettings.settings;
  }

  // read from the response since the store only updates once the api's event comes back
  const lines: Array<string> = [];
  for (let kind of SEARCH_PROVIDER_KINDS) {
    const value = (kind === 'images') ? settings.searchProviderImages : settings.searchProviderWeb;
    if (typeof(value) === 'number') {
      lines.push(formatSearchProvider(translate, kind, value, SearchProviderSources.SERVER));
    } else {
      const provider = (kind === 'images') ? SEARCH_PROVIDER_IMAGES_DEFAULT : SEARCH_PROVIDER_WEB_DEFAULT;
      lines.push(formatSearchProvider(translate, kind, provider, SearchProviderSources.DEFAULT));
    }
  }

  return displayReply(context, {
    description: lines.join('\n'),
    ephemeral: true,
    note: translate('settings_server_set_search_provider.note'),
    title: translate((isEditing) ? 'settings_server_set_search_provider.title_updated' : 'settings_server_set_search_provider.title'),
  });
}
