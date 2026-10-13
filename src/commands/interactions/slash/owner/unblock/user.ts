import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../../utils';

import { BaseOwnerCommandOption } from '../base';


export const COMMAND_NAME = 'user';

export class OwnerUnblockUserCommand extends BaseOwnerCommandOption {
  description = 'Unblock a user from the bot';
  descriptionLocalizations = I18n.localizations('commands.owner.unblock.user.description');
  metadata = {
    id: Formatter.Commands.OwnerUnblockUser.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.unblock.user.name');

  constructor() {
    super({
      options: [
        {name: 'user', description: 'User to unblock', ...I18n.optionLocalizations('commands.owner.unblock.user.user'), required: true, type: ApplicationCommandOptionTypes.USER},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerUnblockUser.CommandArgsBefore) {
    return !!args.user && !args.user.bot;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerUnblockUser.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.user && args.user.bot) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.no_bots')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerUnblockUser.CommandArgs) {
    return Formatter.Commands.OwnerUnblockUser.createMessage(context, args);
  }
}
