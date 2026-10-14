import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { ReportStatuses } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'reports';

export interface CommandArgs {
  status?: string,
}

export default class ReportsCommand extends BaseSlashCommand {
  description = 'List the reports you\'ve sent to the NotSoBot developers and their status';
  descriptionLocalizations = I18n.localizations('commands.reports.description');
  metadata = {
    id: Formatter.Commands.ReportList.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.reports.name');
  triggerLoadingAsEphemeral = true;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        {
          name: 'status',
          description: 'Only show reports with this status',
          ...I18n.optionLocalizations('commands.reports.status'),
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
    return Formatter.Commands.ReportList.createMessage(context, {isEphemeral: true, status});
  }
}
