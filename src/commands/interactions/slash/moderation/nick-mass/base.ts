import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { I18n, editOrReply } from '../../../../../utils';

import { MAX_MEMBERS } from '../../../../prefixed/moderation/nick.mass';
import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  nobots?: boolean,
  nousers?: boolean,
  role?: Structures.Role,
}

export function nickMassFilterOptions(key: string) {
  return [
    {name: 'role', description: 'Only change members with this role', ...I18n.optionLocalizations(`${key}.role`), type: ApplicationCommandOptionTypes.ROLE},
    {name: 'nobots', description: 'Skip bots', ...I18n.optionLocalizations(`${key}.nobots`), type: Boolean},
    {name: 'nousers', description: 'Skip users (only change bots)', ...I18n.optionLocalizations(`${key}.nousers`), type: Boolean},
  ];
}

export class BaseNickMassCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}) {
    super({
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
      permissionsClient: [Permissions.CHANGE_NICKNAMES],
      ...data,
    });
  }

  onBefore(context: Interaction.InteractionContext) {
    return context.user.isClientOwner || ((context.guild) ? context.guild.memberCount <= MAX_MEMBERS : false);
  }

  async onCancel(context: Interaction.InteractionContext) {
    const { language, translate } = await I18n.getTranslator(context);
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} ${translate('nickmass.too_many_members', {max: MAX_MEMBERS.toLocaleString(language)})}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !(args.nobots && args.nousers);
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} ${translate('nickmass.who_then')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }
}
