import { BaseCommandOptionGroup } from '../../basecommand';

import { SearchGoogleImagesCommand } from './google.images';
import { SearchGoogleWebCommand } from './google.web';


export class SearchGoogleGroupCommand extends BaseCommandOptionGroup {
  description = '.';
  name = 'google';

  constructor() {
    super({
      options: [
        new SearchGoogleImagesCommand(),
        new SearchGoogleWebCommand(),
      ],
    });
  }
}
