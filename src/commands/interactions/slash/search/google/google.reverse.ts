import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'reverse';

export class SearchGoogleReverseCommand extends BaseInteractionImageCommandOption {
  description = 'Reverse search an Image using Google';
  descriptionLocalizations = I18n.localizations('commands.search.google.google_reverse.description');
  metadata = {
    id: Formatter.Commands.SearchGoogleReverse.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.google.google_reverse.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchGoogleReverse.CommandArgs) {
    return Formatter.Commands.SearchGoogleReverse.createMessage(context, args);
  }
}
