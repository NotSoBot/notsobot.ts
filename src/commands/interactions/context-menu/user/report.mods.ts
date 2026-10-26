import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';
import { createGuildReportReasonModal, replyIfCannotReport } from '../../slash/report';


export const COMMAND_NAME = 'Report to Mods';

export default class GuildReportUserCommand extends BaseContextMenuUserCommand {
  metadata = {
    id: Formatter.Commands.GuildReport.COMMAND_ID_USER,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.guild_report.name');
  // a deferred interaction can't respond with a modal anymore
  respondsWithModal = true;
  triggerLoadingAfter = -1;

  // the server's own moderators, `Report to NotSoBot` is for the developers
  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    const user = args.member || args.user;
    if (await replyIfCannotReport(context, user.id)) {
      return;
    }
    const modal = await createGuildReportReasonModal(context, {user});
    return context.respond(modal);
  }
}
