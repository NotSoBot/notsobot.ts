import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { ReportTypes } from '../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';
import { createReportReasonModal } from '../../slash/bot/report';


export const COMMAND_NAME = 'Report to NotSoBot';

export default class ReportMessageCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.Report.COMMAND_ID_MESSAGE,
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

  // only our own responses, anything else goes through `/bot report` (or the user context menu)
  onBeforeRun(context: Interaction.InteractionContext, args: ContextMenuMessageArgs) {
    return args.message.fromMe;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: ContextMenuMessageArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('commands.context.report.not_ours'), ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: ContextMenuMessageArgs) {
    const modal = await createReportReasonModal(context, () => ({
      message: args.message,
      type: ReportTypes.MESSAGE,
    }));
    return context.respond(modal);
  }
}
