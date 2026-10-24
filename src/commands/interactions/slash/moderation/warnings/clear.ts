import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { MAX_GUILD_WARNING_USERS, StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  users: Parameters.BanPayload,
}

export const COMMAND_NAME = 'clear';

export class ModerationWarningsClearCommand extends BaseInteractionCommandOption {
  description = 'Remove every warning of multiple users';
  descriptionLocalizations = I18n.localizations('commands.moderation.warnings.clear.description');
  metadata = {
    id: Formatter.Commands.ModerationWarningsClear.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.warnings.clear.name');

  constructor() {
    super({
      permissions: [Permissions.MODERATE_MEMBERS],
      options: [
        {
          name: 'users',
          description: 'Users to clear (Mentions or User IDs, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.warnings.clear.users'),
          required: true,
          value: Parameters.Slash.banPayload({limit: MAX_GUILD_WARNING_USERS}),
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!args.users && (!!args.users.membersOrUsers.length || !!args.users.overLimit);
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_users_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationWarningsClear.createMessage(context, {payload: args.users});
  }
}
