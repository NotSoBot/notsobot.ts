import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';
import { createGuildReportReasonModal, replyIfCannotReport } from '../../slash/report';


export const COMMAND_NAME = 'Report to Mods';

export default class GuildReportMessageCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.GuildReport.COMMAND_ID_MESSAGE,
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

  async run(context: Interaction.InteractionContext, args: ContextMenuMessageArgs) {
    if (await replyIfCannotReport(context, args.message.author.id)) {
      return;
    }
    // the message's text is kept with the report, in case it's deleted before a moderator sees it
    const modal = await createGuildReportReasonModal(context, {message: args.message});
    return context.respond(modal);
  }
}
