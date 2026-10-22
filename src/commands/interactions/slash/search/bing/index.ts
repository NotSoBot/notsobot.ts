import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SearchBingImagesCommand } from './images';
import { SearchBingWebCommand } from './web';


export class SearchBingGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Search Bing';
  descriptionLocalizations = I18n.localizations('commands.search.bing.description');
  name = 'bing';
  nameLocalizations = I18n.localizations('commands.search.bing.name');

  constructor() {
    super({
      options: [
        new SearchBingImagesCommand(),
        new SearchBingWebCommand(),
      ],
    });
  }
}
