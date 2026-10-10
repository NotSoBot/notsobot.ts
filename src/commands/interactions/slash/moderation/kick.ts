import { Interaction } from 'detritus-client';
import { MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { CLEAN_CHOICES } from './ban';


export interface CommandArgs {
  clean: number,
  reason?: string,
  users: Parameters.BanPayloadMembersOnly,
}

export const COMMAND_NAME = 'kick';

export class ModerationKickCommand extends BaseInteractionCommandOption {
  description = 'Kick multiple members, add a reason, and clean their messages';
  metadata = {
    id: Formatter.Commands.ModerationKick.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      permissions: [Permissions.KICK_MEMBERS],
      permissionsClient: [Permissions.BAN_MEMBERS, Permissions.EMBED_LINKS, Permissions.KICK_MEMBERS],
      options: [
        {
          name: 'users',
          description: 'Members to kick (Mentions or User IDs, separated by spaces)',
          required: true,
          value: Parameters.Slash.banPayload({membersOnly: true}),
        },
        {name: 'reason', description: 'Reason (shown in the Audit Log)'},
        {
          name: 'clean',
          description: 'Delete their recent messages (Default: Don\'t Delete Any)',
          choices: CLEAN_CHOICES,
          default: 0,
          type: Number,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!args.users && !!args.users.membersOrUsers.length;
  }

  onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} Couldn\'t find any members. (Use Mentions or User IDs)`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationKick.createMessage(context, {
      clean: args.clean,
      payload: {...args.users, text: args.reason || ''},
    });
  }
}
