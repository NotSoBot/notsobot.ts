import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'wolframalpha';

export class SearchWolframAlphaCommand extends BaseInteractionCommandOption {
  description = 'Search Wolfram Alpha';
  descriptionLocalizations = I18n.localizations('commands.search.wolframalpha.description');
  metadata = {
    id: Formatter.Commands.SearchWolframAlpha.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.wolframalpha.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.wolframalpha.query'), required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchWolframAlpha.CommandArgs) {
    return Formatter.Commands.SearchWolframAlpha.createMessage(context, args);
  }
}
