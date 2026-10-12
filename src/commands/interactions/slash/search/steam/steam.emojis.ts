import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export interface CommandArgs {
  query: string,
}

export class SearchSteamEmojisCommand extends BaseInteractionCommandOption {
  description = 'Search Steam\'s Emojis';
  descriptionLocalizations = I18n.localizations('commands.search.steam.steam_emojis.description');
  metadata = {
    id: Formatter.Commands.SearchSteamEmojis.COMMAND_ID,
  };
  name = 'emojis';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.steam.steam_emojis.query'), required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchSteamEmojis.CommandArgs) {
    return Formatter.Commands.SearchSteamEmojis.createMessage(context, args);
  }
}
