import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n, createSiteLink, displayReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'help';

export default class HelpCommand extends BaseSlashCommand {
  description = 'Get help with NotSoBot\'s commands';
  descriptionLocalizations = I18n.localizations('commands.help.description');
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.help.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  run(context: Interaction.InteractionContext) {
    // `src` is where the click came from, for the site's analytics (notsobot.com-web's src/lib/analyticsUrl.ts)
    return displayReply(context, {description: `${createSiteLink('/commands', 'bot-help')} (Join our support server ${createSiteLink('/support/invite')})`});
  }
}
