import { Interaction } from 'detritus-client';

import { ReportStatuses } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'reports';

export interface CommandArgs {
  status?: string,
}

export class BotReportsCommand extends BaseInteractionCommandOption {
  description = 'See your reports to the NotSoBot developers and their status';
  descriptionLocalizations = I18n.localizations('commands.utils.reports.description');
  metadata = {
    id: Formatter.Commands.ReportList.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.utils.reports.name');
  triggerLoadingAsEphemeral = true;

  constructor() {
    super({
      options: [
        {
          name: 'status',
          description: 'Only show reports with this status',
          ...I18n.optionLocalizations('commands.utils.reports.status'),
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
