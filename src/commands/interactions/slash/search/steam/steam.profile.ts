import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  query: string,
}

export class SearchSteamProfileCommand extends BaseInteractionCommandOption {
  description = 'Show information about a Steam Profile';
  descriptionLocalizations = I18n.localizations('commands.search.steam.steam_profile.description');
  metadata = {
    id: Formatter.Commands.SearchSteamProfile.COMMAND_ID,
  };
  name = 'profile';
  nameLocalizations = I18n.localizations('commands.search.steam.steam_profile.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Steam ID or Steam Vanity', ...I18n.optionLocalizations('commands.search.steam.steam_profile.query'), required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchSteamProfile.CommandArgs) {
    return Formatter.Commands.SearchSteamProfile.createMessage(context, args);
  }
}
