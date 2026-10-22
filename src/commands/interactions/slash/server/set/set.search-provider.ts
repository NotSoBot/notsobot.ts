import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerSetSearchProviderCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set which search engine the search and image commands use in this server';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_search_provider.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetSearchProvider.COMMAND_ID,
  };
  name = 'search-provider';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_search_provider.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'web',
          description: 'Web Search Provider (Default: DuckDuckGo)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_search_provider.web'),
          choices: Parameters.Slash.SEARCH_PROVIDERS_WEB,
          type: Number,
        },
        {
          name: 'images',
          description: 'Image Search Provider (Default: Google)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_search_provider.images'),
          choices: Parameters.Slash.SEARCH_PROVIDERS_IMAGES,
          type: Number,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings_server.set.set_search_provider.clear'),
          choices: Parameters.Slash.SEARCH_PROVIDERS_CLEAR,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetSearchProvider.CommandArgs) {
    return Formatter.Commands.SettingsServerSetSearchProvider.createMessage(context, args);
  }
}
