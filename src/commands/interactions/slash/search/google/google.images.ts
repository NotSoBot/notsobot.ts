import { Interaction } from 'detritus-client';

import { GoogleLocales } from '../../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class SearchGoogleImagesCommand extends BaseInteractionCommandOption {
  description = 'Search Google Images';
  descriptionLocalizations = I18n.localizations('commands.search.google.google_images.description');
  metadata = {
    id: Formatter.Commands.SearchGoogleImages.COMMAND_ID,
  };
  name = 'images';
  nameLocalizations = I18n.localizations('commands.search.google.google_images.name');

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Search Text',
          ...I18n.optionLocalizations('commands.search.google.google_images.query'),
          required: true,
        },
        {
          name: 'locale',
          description: 'Language for the Google Results',
          ...I18n.optionLocalizations('commands.search.google.google_images.locale'),
          default: DefaultParameters.locale,
          onAutoComplete: Parameters.AutoComplete.googleLocales,
        },
        {
          name: 'randomize',
          description: 'Randomize the Image Results',
          ...I18n.optionLocalizations('commands.search.google.google_images.randomize'),
          type: Boolean,
        },
        {
          name: 'safe',
          description: 'Safe Search',
          ...I18n.optionLocalizations('commands.search.google.google_images.safe'),
          type: Boolean,
          default: DefaultParameters.safe,
          value: Parameters.Slash.safe,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchGoogleImages.CommandArgs) {
    return Formatter.Commands.SearchGoogleImages.createMessage(context, args);
  }
}
