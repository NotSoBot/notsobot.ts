import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SearchGoogleImagesCommand } from './google.images';
import { SearchGoogleImagesSimpleCommand } from './google.images-simple';
import { SearchGoogleWebCommand } from './google.web';


export class SearchGoogleGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'google';

  constructor() {
    super({
      options: [
        new SearchGoogleImagesCommand(),
        new SearchGoogleImagesSimpleCommand(),
        new SearchGoogleWebCommand(),
      ],
    });
  }
}
