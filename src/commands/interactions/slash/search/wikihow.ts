import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'wikihow';

export class SearchWikihowCommand extends BaseInteractionCommandOption {
  description = 'Search WikiHow';
  descriptionLocalizations = I18n.localizations('commands.search.wikihow.description');
  metadata = {
    id: Formatter.Commands.SearchWikihow.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.wikihow.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.wikihow.query')},
        {name: 'random', description: 'Get a random article', ...I18n.optionLocalizations('commands.search.wikihow.random'), type: Boolean},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.SearchWikihow.CommandArgs) {
    return !!args.query || !!args.random;
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchWikihow.CommandArgs) {
    return Formatter.Commands.SearchWikihow.createMessage(context, args);
  }
}
