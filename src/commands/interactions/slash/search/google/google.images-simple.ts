import { Interaction } from 'detritus-client';

import { GoogleLocales } from '../../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class SearchGoogleImagesSimpleCommand extends BaseInteractionCommandOption {
  description = 'Search Google Images but with less data displayed';
  descriptionLocalizations = I18n.localizations('commands.search.google.google_images_simple.description');
  metadata = {
    id: Formatter.Commands.SearchGoogleImages.COMMAND_ID_SIMPLE,
  };
  name = 'images-simple';
  nameLocalizations = I18n.localizations('commands.search.google.google_images_simple.name');

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Search Text',
          ...I18n.optionLocalizations('commands.search.google.google_images_simple.query'),
          required: true,
        },
        {
          name: 'locale',
          description: 'Language for the Google Results',
          ...I18n.optionLocalizations('commands.search.google.google_images_simple.locale'),
          default: DefaultParameters.locale,
          onAutoComplete: Parameters.AutoComplete.googleLocales,
        },
        {
          name: 'randomize',
          description: 'Randomize the Image Results',
          ...I18n.optionLocalizations('commands.search.google.google_images_simple.randomize'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchGoogleImages.CommandArgs) {
    return Formatter.Commands.SearchGoogleImages.createMessage(context, {
      ...args,
      simple: true,
    });
  }
}
