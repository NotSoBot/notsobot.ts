import { Interaction } from 'detritus-client';

import { RestResponsesRaw } from '../../../../api/types';
import { ReportTypes } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  reason: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export class TagReportCommand extends BaseInteractionCommandOption {
  description = 'Report a tag to the NotSoBot developers';
  descriptionLocalizations = I18n.localizations('commands.tag.report.description');
  metadata = {
    id: Formatter.Commands.Report.COMMAND_ID_TAG,
  };
  name = 'report';
  nameLocalizations = I18n.localizations('commands.tag.report.name');
  triggerLoadingAsEphemeral = true;

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.report.name'),
          label: 'tag',
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
        {
          name: 'reason',
          description: 'Why you\'re reporting this tag',
          ...I18n.optionLocalizations('commands.tag.report.reason'),
          maxLength: Formatter.Commands.Report.MAX_CONTENT_LENGTH,
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    // no modal, so it confirms with the warning against report spam first, like the prefixed commands
    return Formatter.Commands.Report.createMessage(context, {
      content: args.reason,
      tag: args.tag,
      type: ReportTypes.TAG,
    });
  }
}
