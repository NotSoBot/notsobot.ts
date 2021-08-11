import { Interaction } from 'detritus-client';

import { GoogleLocales } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseCommandOption } from '../../basecommand';


export interface CommandArgs {
  locale?: GoogleLocales,
  query: string,
  randomize?: boolean,
  safe?: boolean,
}

export class SearchGoogleImagesCommand extends BaseCommandOption {
  description = 'Search Google Images';
  name = 'images';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', required: true},
        {name: 'locale', description: 'Language for the Google Results', choices: Parameters.Slash.GOOGLE_LOCALES},
        {name: 'safe', type: Boolean, description: 'Safe Search'},
        {name: 'randomize', type: Boolean, description: 'Randomize the Image Results'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SearchGoogleImages.createMessage(context, args);
  }
}
