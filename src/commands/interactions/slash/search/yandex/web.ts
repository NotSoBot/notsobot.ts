import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'web';

export class SearchYandexWebCommand extends BaseInteractionCommandOption {
  description = 'Search Yandex';
  descriptionLocalizations = I18n.localizations('commands.search.yandex.web.description');
  metadata = {
    id: Formatter.Commands.SearchYandex.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.yandex.web.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.yandex.web.query'), required: true},
        {name: 'randomize', description: 'Randomize the results', ...I18n.optionLocalizations('commands.search.yandex.web.randomize'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchYandex.CommandArgs) {
    return Formatter.Commands.SearchYandex.createMessage(context, args);
  }
}
