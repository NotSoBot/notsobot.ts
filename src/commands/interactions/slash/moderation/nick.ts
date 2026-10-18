import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  nickname?: string,
  user: Structures.Member | Structures.User,
}

export const COMMAND_NAME = 'nick';

export class ModerationNickCommand extends BaseInteractionCommandOption {
  description = 'Change or reset a member\'s nickname';
  descriptionLocalizations = I18n.localizations('commands.moderation.nick.description');
  metadata = {
    id: Formatter.Commands.ModerationNick.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.nick.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_NICKNAMES],
      permissionsClient: [Permissions.MANAGE_NICKNAMES],
      options: [
        {name: 'user', description: 'Member to change', ...I18n.optionLocalizations('commands.moderation.nick.user'), required: true, type: ApplicationCommandOptionTypes.USER},
        {
          name: 'nickname',
          description: 'New nickname (Leave empty to reset it)',
          ...I18n.optionLocalizations('commands.moderation.nick.nickname'),
          maxLength: Formatter.Commands.ModerationNick.MAX_NICKNAME_LENGTH,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return args.user instanceof Structures.Member;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationNick.createMessage(context, {
      member: args.user as Structures.Member,
      nickname: args.nickname,
    });
  }
}
