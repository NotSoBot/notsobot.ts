import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'images';

export class SearchBingImagesCommand extends BaseInteractionCommandOption {
  description = 'Search Bing Images';
  descriptionLocalizations = I18n.localizations('commands.search.bing.images.description');
  metadata = {
    id: Formatter.Commands.SearchBingImages.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.bing.images.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.bing.images.query'), required: true},
        {name: 'randomize', description: 'Randomize the results', ...I18n.optionLocalizations('commands.search.bing.images.randomize'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchBingImages.CommandArgs) {
    return Formatter.Commands.SearchBingImages.createMessage(context, args);
  }
}
