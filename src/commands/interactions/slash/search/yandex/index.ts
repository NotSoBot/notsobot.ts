import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SearchYandexImagesCommand } from './images';
import { SearchYandexWebCommand } from './web';


export class SearchYandexGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Search Yandex';
  descriptionLocalizations = I18n.localizations('commands.search.yandex.description');
  name = 'yandex';
  nameLocalizations = I18n.localizations('commands.search.yandex.name');

  constructor() {
    super({
      options: [
        new SearchYandexImagesCommand(),
        new SearchYandexWebCommand(),
      ],
    });
  }
}
