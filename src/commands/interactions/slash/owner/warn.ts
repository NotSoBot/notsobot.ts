import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../utils';

import { BaseOwnerCommandOption } from './base';


export const COMMAND_NAME = 'warn';

interface CommandArgs {
  reason: string,
  user: Structures.Member | Structures.User | null,
}

export class OwnerWarnCommand extends BaseOwnerCommandOption {
  description = 'Warn a user as NotSoBot staff, they see it in DMs and on their next command';
  descriptionLocalizations = I18n.localizations('commands.owner.warn.description');
  metadata = {
    id: Formatter.Commands.OwnerWarn.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.warn.name');

  constructor() {
    super({
      options: [
        {name: 'user', description: 'User to warn', ...I18n.optionLocalizations('commands.owner.warn.user'), required: true, type: ApplicationCommandOptionTypes.USER},
        {name: 'reason', description: 'Reason (sent to them)', ...I18n.optionLocalizations('commands.owner.warn.reason'), required: true},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!args.user && !args.user.bot;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (args.user && args.user.bot) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.no_bots')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.OwnerWarn.createMessage(context, {reason: args.reason, users: [args.user!]});
  }
}
