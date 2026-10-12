import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SearchDuckDuckGoImagesCommand } from './images';
import { SearchDuckDuckGoWebCommand } from './web';


export class SearchDuckDuckGoGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Search DuckDuckGo';
  descriptionLocalizations = I18n.localizations('commands.search.duckduckgo.description');
  name = 'duckduckgo';
  nameLocalizations = I18n.localizations('commands.search.duckduckgo.name');

  constructor() {
    super({
      options: [
        new SearchDuckDuckGoImagesCommand(),
        new SearchDuckDuckGoWebCommand(),
      ],
    });
  }
}
