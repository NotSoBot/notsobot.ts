import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'applications';

export class InfoApplicationsCommand extends BaseInteractionCommandOption {
  description = 'Get information about an application (Uses the same list Discord does)';
  descriptionLocalizations = I18n.localizations('commands.info.applications.description');
  metadata = {
    id: Formatter.Commands.InfoApplications.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.applications.name');

  constructor() {
    super({
      options: [
        {
          name: 'application',
          description: 'Application Name or ID',
          ...I18n.optionLocalizations('commands.info.applications.application'),
          label: 'applications',
          required: true,
          value: Parameters.applications,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoApplications.CommandArgsBefore) {
    return !!args.applications.length;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoApplications.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.game_not_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.InfoApplications.CommandArgs) {
    return Formatter.Commands.InfoApplications.createMessage(context, args);
  }
}
