import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'images';

export class SearchYandexImagesCommand extends BaseInteractionCommandOption {
  description = 'Search Yandex Images';
  descriptionLocalizations = I18n.localizations('commands.search.yandex.images.description');
  metadata = {
    id: Formatter.Commands.SearchYandexImages.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.yandex.images.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.yandex.images.query'), required: true},
        {name: 'randomize', description: 'Randomize the results', ...I18n.optionLocalizations('commands.search.yandex.images.randomize'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchYandexImages.CommandArgs) {
    return Formatter.Commands.SearchYandexImages.createMessage(context, args);
  }
}
