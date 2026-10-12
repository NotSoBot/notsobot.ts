import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'urban';

export class SearchUrbanCommand extends BaseInteractionCommandOption {
  description = 'Search Urban Dictionary';
  descriptionLocalizations = I18n.localizations('commands.search.urban.description');
  metadata = {
    id: Formatter.Commands.SearchUrban.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.urban.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text (Default: Random)', ...I18n.optionLocalizations('commands.search.urban.query')},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchUrban.CommandArgs) {
    return Formatter.Commands.SearchUrban.createMessage(context, args);
  }
}
