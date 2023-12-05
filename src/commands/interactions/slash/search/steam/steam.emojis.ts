import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export interface CommandArgs {
  query: string,
}

export class SearchSteamEmojisCommand extends BaseInteractionCommandOption {
  description = 'Search Steam\'s Emojis';
  metadata = {
    id: Formatter.Commands.SearchSteamEmojis.COMMAND_ID,
  };
  name = 'emojis';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchSteamEmojis.CommandArgs) {
    return Formatter.Commands.SearchSteamEmojis.createMessage(context, args);
  }
}
