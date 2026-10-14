import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'terms';

export class LegalTermsCommand extends BaseInteractionCommandOption {
  description = 'Terms of Service';
  descriptionLocalizations = I18n.localizations('commands.legal.terms.description');
  metadata = {
    id: Formatter.Commands.UtilsTerms.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.legal.terms.name');

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.UtilsTerms.createMessage(context);
  }
}
