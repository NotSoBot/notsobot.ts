import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'web';

export class SearchDuckDuckGoWebCommand extends BaseInteractionCommandOption {
  description = 'Search DuckDuckGo';
  descriptionLocalizations = I18n.localizations('commands.search.duckduckgo.web.description');
  metadata = {
    id: Formatter.Commands.SearchDuckDuckGo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.duckduckgo.web.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.duckduckgo.web.query'), required: true},
        {name: 'randomize', description: 'Randomize the results', ...I18n.optionLocalizations('commands.search.duckduckgo.web.randomize'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchDuckDuckGo.CommandArgs) {
    return Formatter.Commands.SearchDuckDuckGo.createMessage(context, args);
  }
}
