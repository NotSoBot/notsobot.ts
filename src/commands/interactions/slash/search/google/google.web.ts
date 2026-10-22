import { Interaction } from 'detritus-client';

import { GoogleLocales } from '../../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  locale?: GoogleLocales,
  query: string,
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
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SearchGoogleWeb.createMessage(context, args);
  }
}
