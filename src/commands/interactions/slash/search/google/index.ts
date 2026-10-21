import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SearchGoogleImagesCommand } from './google.images';
import { SearchGoogleImagesSimpleCommand } from './google.images-simple';
import { SearchGoogleReverseCommand } from './google.reverse';
import { SearchGoogleWebCommand } from './google.web';


export class SearchGoogleGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Search Google';
  descriptionLocalizations = I18n.localizations('commands.search.google.description');
  name = 'google';

  constructor() {
    super({
      options: [
        new SearchGoogleImagesCommand(),
        new SearchGoogleImagesSimpleCommand(),
        new SearchGoogleReverseCommand(),
        new SearchGoogleWebCommand(),
      ],
    });
  }
}
