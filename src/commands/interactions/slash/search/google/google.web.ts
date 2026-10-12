import { Interaction } from 'detritus-client';

import { GoogleLocales } from '../../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  locale?: GoogleLocales,
  query: string,
  safe?: boolean,
}

export class SearchGoogleWebCommand extends BaseInteractionCommandOption {
  description = 'Search Google';
  descriptionLocalizations = I18n.localizations('commands.search.google.google_web.description');
  metadata = {
    id: Formatter.Commands.SearchGoogleWeb.COMMAND_ID,
  };
  name = 'web';

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Search Text',
          ...I18n.optionLocalizations('commands.search.google.google_web.query'),
          required: true,
        },
        {
          name: 'locale',
          description: 'Language for the Google Results',
          ...I18n.optionLocalizations('commands.search.google.google_web.locale'),
          default: DefaultParameters.locale,
          onAutoComplete: Parameters.AutoComplete.googleLocales,
        },
        {
          name: 'safe',
          description: 'Safe Search',
          ...I18n.optionLocalizations('commands.search.google.google_web.safe'),
          type: Boolean,
          default: DefaultParameters.safe,
          value: Parameters.Slash.safe,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SearchGoogleWeb.createMessage(context, args);
  }
}
