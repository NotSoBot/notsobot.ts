import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { ReportTypes } from '../../../../constants';
import { Formatter, I18n } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';
import { createReportReasonModal } from '../../slash/report';


export const COMMAND_NAME = 'Report';

export default class ReportUserCommand extends BaseContextMenuUserCommand {
  metadata = {
    id: Formatter.Commands.Report.COMMAND_ID_USER,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.report.name');
  // a deferred interaction can't respond with a modal anymore
  respondsWithModal = true;
  triggerLoadingAfter = -1;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    const modal = await createReportReasonModal(context, () => ({
      type: ReportTypes.USER,
      user: args.member || args.user,
    }));
    return context.respond(modal);
  }
}
