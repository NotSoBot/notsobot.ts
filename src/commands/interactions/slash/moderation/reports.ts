import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { ReportStatuses } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  status?: string,
}

export const COMMAND_NAME = 'reports';

export class ModerationReportsCommand extends BaseInteractionCommandOption {
  description = 'See members\' reports to this server\'s moderators';
  descriptionLocalizations = I18n.localizations('commands.moderation.reports.description');
  metadata = {
    id: Formatter.Commands.ModerationReports.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.reports.name');
  // who reported who stays between the moderators
  triggerLoadingAsEphemeral = true;

  constructor() {
    super({
      permissions: [Permissions.MODERATE_MEMBERS],
      options: [
        {
          name: 'status',
          description: 'Only show reports with this status',
          ...I18n.optionLocalizations('commands.moderation.reports.status'),
          choices: Parameters.Slash.oneOf({
            choices: {OPEN: 'open', RESOLVED: 'resolved', DISMISSED: 'dismissed'},
            doNotSort: true,
            localizationKey: 'choices.report_statuses',
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const status = (args.status) ? ReportStatuses[args.status.toUpperCase() as keyof typeof ReportStatuses] : undefined;
    return Formatter.Commands.ModerationReports.createMessage(context, {isEphemeral: true, status});
  }
}
