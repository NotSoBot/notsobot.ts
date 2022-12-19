import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';



export interface CommandArgs {
  query: string,
}

export class SearchYoutubeCommand extends BaseInteractionCommandOption {
  description = 'Search YouTube';
  metadata = {
    id: Formatter.Commands.SearchYoutube.COMMAND_ID,
  };
  name = 'youtube';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', required: true},
        {name: 'sp', description: 'Search Parameters Code'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchYoutube.CommandArgs) {
    return Formatter.Commands.SearchYoutube.createMessage(context, args);
  }
}
