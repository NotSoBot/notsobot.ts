import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';



export interface CommandArgs {
  query: string,
}

export class SearchYoutubeCommand extends BaseInteractionCommandOption {
  description = 'Search YouTube';
  descriptionLocalizations = I18n.localizations('commands.search.youtube.description');
  metadata = {
    id: Formatter.Commands.SearchYoutube.COMMAND_ID,
  };
  name = 'youtube';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.youtube.query'), required: true},
        {name: 'sp', description: 'Search Parameters Code', ...I18n.optionLocalizations('commands.search.youtube.sp')},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchYoutube.CommandArgs) {
    return Formatter.Commands.SearchYoutube.createMessage(context, args);
  }
}
