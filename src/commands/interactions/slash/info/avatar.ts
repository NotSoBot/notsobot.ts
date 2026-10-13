import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'avatar';

export class InfoAvatarCommand extends BaseInteractionCommandOption {
  description = 'Get the avatar of a user';
  descriptionLocalizations = I18n.localizations('commands.info.avatar.description');
  metadata = {
    id: Formatter.Commands.InfoAvatar.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.avatar.name');

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to get the avatar of (Default: You)',
          ...I18n.optionLocalizations('commands.info.avatar.user'),
          default: DefaultParameters.author,
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'default',
          description: 'Show their default avatar instead',
          ...I18n.optionLocalizations('commands.info.avatar.default'),
          type: Boolean,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoAvatar.CommandArgsBefore) {
    return !!args.user;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoAvatar.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.InfoAvatar.CommandArgs) {
    return Formatter.Commands.InfoAvatar.createMessage(context, {...args, default: !!args.default});
  }
}
