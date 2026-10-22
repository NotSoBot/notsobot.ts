import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class SearchImagesSimpleCommand extends BaseInteractionCommandOption {
  description = 'Search Images from Bing, DuckDuckGo, or Google but with less data displayed';
  descriptionLocalizations = I18n.localizations('commands.search.images_simple.description');
  metadata = {
    id: Formatter.Commands.SearchImages.COMMAND_ID_SIMPLE,
  };
  name = 'images-simple';
  nameLocalizations = I18n.localizations('commands.search.images_simple.name');

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Search Text',
          ...I18n.optionLocalizations('commands.search.images_simple.query'),
          required: true,
        },
        {
          name: 'randomize',
          description: 'Randomize the Image Results',
          ...I18n.optionLocalizations('commands.search.images_simple.randomize'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchImages.CommandArgs) {
    return Formatter.Commands.SearchImages.createMessage(context, {
      ...args,
      simple: true,
    });
  }
}
