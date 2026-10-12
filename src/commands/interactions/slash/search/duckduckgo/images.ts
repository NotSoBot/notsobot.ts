import { Interaction } from 'detritus-client';

import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'images';

export class SearchDuckDuckGoImagesCommand extends BaseInteractionCommandOption {
  description = 'Search DuckDuckGo Images';
  descriptionLocalizations = I18n.localizations('commands.search.duckduckgo.images.description');
  metadata = {
    id: Formatter.Commands.SearchDuckDuckGoImages.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.duckduckgo.images.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.duckduckgo.images.query'), required: true},
        {name: 'randomize', description: 'Randomize the results', ...I18n.optionLocalizations('commands.search.duckduckgo.images.randomize'), type: Boolean},
        {name: 'safe', description: 'Safe Search', ...I18n.optionLocalizations('commands.search.duckduckgo.images.safe'), type: Boolean, default: DefaultParameters.safe, value: Parameters.Slash.safe},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchDuckDuckGoImages.CommandArgs) {
    return Formatter.Commands.SearchDuckDuckGoImages.createMessage(context, args);
  }
}
