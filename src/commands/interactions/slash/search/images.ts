import { Interaction } from 'detritus-client';

import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class SearchImagesCommand extends BaseInteractionCommandOption {
  description = 'Search Images from Bing, DuckDuckGo, or Google';
  descriptionLocalizations = I18n.localizations('commands.search.images.description');
  metadata = {
    id: Formatter.Commands.SearchImages.COMMAND_ID,
  };
  name = 'images';
  nameLocalizations = I18n.localizations('commands.search.images.name');

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Search Text',
          ...I18n.optionLocalizations('commands.search.images.query'),
          required: true,
        },
        {
          name: 'randomize',
          description: 'Randomize the Image Results',
          ...I18n.optionLocalizations('commands.search.images.randomize'),
          type: Boolean,
        },
        {
          name: 'safe',
          description: 'Safe Search',
          ...I18n.optionLocalizations('commands.search.images.safe'),
          type: Boolean,
          default: DefaultParameters.safe,
          value: Parameters.Slash.safe,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchImages.CommandArgs) {
    return Formatter.Commands.SearchImages.createMessage(context, args);
  }
}
