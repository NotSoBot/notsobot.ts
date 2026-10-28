import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'privacy';

export class LegalPrivacyCommand extends BaseInteractionCommandOption {
  description = 'Show NotSoBot\'s Privacy Policy';
  descriptionLocalizations = I18n.localizations('commands.legal.privacy.description');
  metadata = {
    id: Formatter.Commands.UtilsPrivacy.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.legal.privacy.name');

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.UtilsPrivacy.createMessage(context);
  }
}
