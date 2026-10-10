import { Interaction } from 'detritus-client';
import { MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  reason?: string,
  users: Parameters.BanPayload,
}

export const COMMAND_NAME = 'unban';

export class ModerationUnbanCommand extends BaseInteractionCommandOption {
  description = 'Unban multiple users and add a reason';
  metadata = {
    id: Formatter.Commands.ModerationUnban.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      permissions: [Permissions.BAN_MEMBERS],
      permissionsClient: [Permissions.BAN_MEMBERS, Permissions.EMBED_LINKS],
      options: [
        {
          name: 'users',
          description: 'Users to unban (User IDs, separated by spaces)',
          required: true,
          value: Parameters.Slash.banPayload(),
        },
        {name: 'reason', description: 'Reason (shown in the Audit Log)'},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!args.users && !!args.users.membersOrUsers.length;
  }

  onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} Couldn\'t find any users. (Use User IDs)`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationUnban.createMessage(context, {
      payload: {...args.users, text: args.reason || ''},
    });
  }
}
