import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'imgur';

export class SearchImgurCommand extends BaseInteractionCommandOption {
  description = 'Search Imgur';
  descriptionLocalizations = I18n.localizations('commands.search.imgur.description');
  metadata = {
    id: Formatter.Commands.SearchImgur.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.imgur.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.imgur.query'), required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchImgur.CommandArgs) {
    return Formatter.Commands.SearchImgur.createMessage(context, args);
  }
}
