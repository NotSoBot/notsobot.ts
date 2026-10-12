import { Interaction } from 'detritus-client';
import { MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  reason?: string,
  users: Parameters.BanPayload,
}

export const COMMAND_NAME = 'unban';

export class ModerationUnbanCommand extends BaseInteractionCommandOption {
  description = 'Unban multiple users and add a reason';
  descriptionLocalizations = I18n.localizations('commands.moderation.unban.description');
  metadata = {
    id: Formatter.Commands.ModerationUnban.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.unban.name');

  constructor() {
    super({
      permissions: [Permissions.BAN_MEMBERS],
      permissionsClient: [Permissions.BAN_MEMBERS, Permissions.EMBED_LINKS],
      options: [
        {
          name: 'users',
          description: 'Users to unban (User IDs, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.unban.users'),
          required: true,
          value: Parameters.Slash.banPayload(),
        },
        {name: 'reason', description: 'Reason (shown in the Audit Log)', ...I18n.optionLocalizations('commands.moderation.unban.reason')},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!args.users && !!args.users.membersOrUsers.length;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} ${translate('moderation.no_users_found_ids')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationUnban.createMessage(context, {
      payload: {...args.users, text: args.reason || ''},
    });
  }
}
