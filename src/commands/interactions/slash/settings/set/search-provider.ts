import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetSearchProviderCommand extends BaseInteractionCommandOption {
  description = 'Set which search engine the search and image commands use for you';
  descriptionLocalizations = I18n.localizations('commands.settings.set.search_provider.description');
  metadata = {
    id: Formatter.Commands.SettingsSetSearchProvider.COMMAND_ID,
  };
  name = 'search-provider';
  nameLocalizations = I18n.localizations('commands.settings.set.search_provider.name');

  constructor() {
    super({
      options: [
        {
          name: 'web',
          description: 'Web Search Provider (Default: Server Setting)',
          ...I18n.optionLocalizations('commands.settings.set.search_provider.web'),
          choices: Parameters.Slash.SEARCH_PROVIDERS,
          type: Number,
        },
        {
          name: 'images',
          description: 'Image Search Provider (Default: Server Setting)',
          ...I18n.optionLocalizations('commands.settings.set.search_provider.images'),
          choices: Parameters.Slash.SEARCH_PROVIDERS,
          type: Number,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.search_provider.clear'),
          choices: Parameters.Slash.SEARCH_PROVIDERS_CLEAR,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetSearchProvider.CommandArgs) {
    return Formatter.Commands.SettingsSetSearchProvider.createMessage(context, args);
  }
}
