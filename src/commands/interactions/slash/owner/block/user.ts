import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseOwnerCommandOption } from '../base';


export const COMMAND_NAME = 'user';

export class OwnerBlockUserCommand extends BaseOwnerCommandOption {
  description = 'Block users from the bot';
  descriptionLocalizations = I18n.localizations('commands.owner.block.user.description');
  metadata = {
    id: Formatter.Commands.OwnerBlockUser.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.block.user.name');

  constructor() {
    super({
      options: [
        {
          name: 'users',
          description: 'Users to block (Mentions or User IDs, separated by spaces)',
          ...I18n.optionLocalizations('commands.owner.block.user.users'),
          label: 'payload',
          required: true,
          value: Parameters.Slash.banPayload({allowBots: false}),
        },
        {
          name: 'duration',
          description: 'Unblock them after this long, like 12h or 7 days (Default: Permanent, Max: 5 years)',
          ...I18n.optionLocalizations('commands.owner.block.user.duration'),
          value: Parameters.secondsWithOptions({float: false}),
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerBlockUser.CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerBlockUser.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.needs_members')}`});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerBlockUser.CommandArgs) {
    return Formatter.Commands.OwnerBlockUser.createMessage(context, args);
  }
}
