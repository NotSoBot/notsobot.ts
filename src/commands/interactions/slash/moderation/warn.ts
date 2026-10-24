import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { MAX_GUILD_WARNING_USERS, StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  reason?: string,
  users: Parameters.BanPayloadMembersOnly,
}

export const COMMAND_NAME = 'warn';

export class ModerationWarnCommand extends BaseInteractionCommandOption {
  description = 'Warn multiple members with a reason, kept on their record here';
  descriptionLocalizations = I18n.localizations('commands.moderation.warn.description');
  metadata = {
    id: Formatter.Commands.ModerationWarn.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.warn.name');

  constructor() {
    super({
      permissions: [Permissions.MODERATE_MEMBERS],
      options: [
        {
          name: 'users',
          description: 'Members to warn (Mentions or User IDs, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.warn.users'),
          required: true,
          value: Parameters.Slash.banPayload({limit: MAX_GUILD_WARNING_USERS, membersOnly: true}),
        },
        {name: 'reason', description: 'Reason (sent to them)', ...I18n.optionLocalizations('commands.moderation.warn.reason')},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    // over the limit still runs, so it says why instead of that nobody was found
    return !!args.users && (!!args.users.membersOrUsers.length || !!args.users.overLimit);
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationWarn.createMessage(context, {
      payload: {...args.users, text: args.reason || ''},
    });
  }
}
