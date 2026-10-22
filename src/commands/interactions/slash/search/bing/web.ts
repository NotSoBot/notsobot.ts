import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'web';

export class SearchBingWebCommand extends BaseInteractionCommandOption {
  description = 'Search Bing';
  descriptionLocalizations = I18n.localizations('commands.search.bing.web.description');
  metadata = {
    id: Formatter.Commands.SearchBing.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.bing.web.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.bing.web.query'), required: true},
        {name: 'randomize', description: 'Randomize the results', ...I18n.optionLocalizations('commands.search.bing.web.randomize'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchBing.CommandArgs) {
    return Formatter.Commands.SearchBing.createMessage(context, args);
  }
}
