import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  as?: string,
  query: string,
}

export class SearchSteamCommunityCommand extends BaseInteractionCommandOption {
  description = 'Search Steam Community';
  descriptionLocalizations = I18n.localizations('commands.search.steam.steam_community.description');
  metadata = {
    id: Formatter.Commands.SearchSteamCommunity.COMMAND_ID,
  };
  name = 'community';
  nameLocalizations = I18n.localizations('commands.search.steam.steam_community.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.steam.steam_community.query'), required: true},
        {name: 'as', description: 'Steam ID to search as I think', ...I18n.optionLocalizations('commands.search.steam.steam_community.as')},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchSteamCommunity.CommandArgs) {
    return Formatter.Commands.SearchSteamCommunity.createMessage(context, args);
  }
}
