import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  reason?: string,
  users: Parameters.BanPayloadMembersOnly,
}

export const COMMAND_NAME = 'unmute';

export class ModerationUnmuteCommand extends BaseInteractionCommandOption {
  description = 'Remove the timeout from multiple members';
  descriptionLocalizations = I18n.localizations('commands.moderation.unmute.description');
  metadata = {
    id: Formatter.Commands.ModerationUnmute.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.unmute.name');

  constructor() {
    super({
      permissions: [Permissions.MODERATE_MEMBERS],
      permissionsClient: [Permissions.MODERATE_MEMBERS],
      options: [
        {
          name: 'users',
          description: 'Members to unmute (Mentions or User IDs, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.unmute.users'),
          required: true,
          value: Parameters.Slash.banPayload({membersOnly: true}),
        },
        {name: 'reason', description: 'Reason (shown in the Audit Log)', ...I18n.optionLocalizations('commands.moderation.unmute.reason')},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!args.users && !!args.users.membersOrUsers.length;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationUnmute.createMessage(context, {
      payload: {...args.users, text: args.reason || ''},
    });
  }
}
