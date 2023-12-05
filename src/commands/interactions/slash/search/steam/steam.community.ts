import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  as?: string,
  query: string,
}

export class SearchSteamCommunityCommand extends BaseInteractionCommandOption {
  description = 'Search Steam Community';
  metadata = {
    id: Formatter.Commands.SearchSteamCommunity.COMMAND_ID,
  };
  name = 'community';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', required: true},
        {name: 'as', description: 'Steam ID to search as I think'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchSteamCommunity.CommandArgs) {
    return Formatter.Commands.SearchSteamCommunity.createMessage(context, args);
  }
}
