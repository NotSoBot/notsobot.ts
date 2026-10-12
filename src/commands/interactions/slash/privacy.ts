import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'privacy';

export default class PrivacyCommand extends BaseSlashCommand {
  description = 'Privacy Policy';
  descriptionLocalizations = I18n.localizations('commands.privacy.description');
  metadata = {
    id: Formatter.Commands.UtilsPrivacy.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.privacy.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.UtilsPrivacy.createMessage(context);
  }
}
