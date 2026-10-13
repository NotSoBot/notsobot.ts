import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'activity';

export class InfoActivityCommand extends BaseInteractionCommandOption {
  description = 'Get a user\'s current activity';
  descriptionLocalizations = I18n.localizations('commands.info.activity.description');
  metadata = {
    id: Formatter.Commands.InfoActivity.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.activity.name');

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to get the activity of (Default: You)',
          ...I18n.optionLocalizations('commands.info.activity.user'),
          default: DefaultParameters.author,
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoActivity.CommandArgsBefore) {
    return !!args.user;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoActivity.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.InfoActivity.CommandArgs) {
    return Formatter.Commands.InfoActivity.createMessage(context, args);
  }
}
