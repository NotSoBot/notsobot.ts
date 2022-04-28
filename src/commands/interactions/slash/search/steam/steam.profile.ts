import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  query: string,
}

export class SearchSteamProfileCommand extends BaseInteractionCommandOption {
  description = 'Show information about a Steam Profile';
  metadata = {
    id: Formatter.Commands.SearchSteamProfile.COMMAND_ID,
  };
  name = 'profile';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Steam ID or Steam Vanity', required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchSteamProfile.CommandArgs) {
    return Formatter.Commands.SearchSteamProfile.createMessage(context, args);
  }
}
