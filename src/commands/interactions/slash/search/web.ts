import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'web';

export class SearchWebCommand extends BaseInteractionCommandOption {
  description = 'Search the web with DuckDuckGo or Google';
  descriptionLocalizations = I18n.localizations('commands.search.web.description');
  metadata = {
    id: Formatter.Commands.SearchWeb.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.web.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.web.query'), required: true},
        {name: 'randomize', description: 'Randomize the results', ...I18n.optionLocalizations('commands.search.web.randomize'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchWeb.CommandArgs) {
    return Formatter.Commands.SearchWeb.createMessage(context, args);
  }
}
