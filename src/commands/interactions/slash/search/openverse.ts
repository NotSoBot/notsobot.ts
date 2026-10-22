import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'openverse';

export class SearchOpenverseCommand extends BaseInteractionCommandOption {
  description = 'Search Openverse for openly licensed images';
  descriptionLocalizations = I18n.localizations('commands.search.openverse.description');
  metadata = {
    id: Formatter.Commands.SearchOpenverse.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.openverse.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.openverse.query'), required: true},
        {name: 'randomize', description: 'Randomize the results', ...I18n.optionLocalizations('commands.search.openverse.randomize'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchOpenverse.CommandArgs) {
    return Formatter.Commands.SearchOpenverse.createMessage(context, args);
  }
}
