import { Interaction } from 'detritus-client';

import { GoogleLocales } from '../../../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  locale?: GoogleLocales,
  query: string,
  safe?: boolean,
}

export class SearchGoogleWebCommand extends BaseInteractionCommandOption {
  description = 'Search Google';
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
          required: true,
        },
        {
          name: 'locale',
          description: 'Language for the Google Results',
          default: DefaultParameters.locale,
          onAutoComplete: Parameters.AutoComplete.googleLocales,
        },
        {
          name: 'safe',
          description: 'Safe Search',
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
