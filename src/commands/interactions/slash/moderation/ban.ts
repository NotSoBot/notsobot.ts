import { Interaction } from 'detritus-client';
import { MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  clean: number,
  reason?: string,
  users: Parameters.BanPayload,
}

export const COMMAND_NAME = 'ban';

export const CLEAN_CHOICES = [
  {name: 'Don\'t Delete Any', value: 0},
  {name: 'Previous Hour', value: 60 * 60},
  {name: 'Previous 6 Hours', value: 6 * 60 * 60},
  {name: 'Previous 12 Hours', value: 12 * 60 * 60},
  {name: 'Previous 24 Hours', value: 24 * 60 * 60},
  {name: 'Previous 3 Days', value: 3 * 24 * 60 * 60},
  {name: 'Previous 7 Days', value: 7 * 24 * 60 * 60},
];


export class ModerationBanCommand extends BaseInteractionCommandOption {
  description = 'Ban multiple users, add a reason, and clean their messages';
  metadata = {
    id: Formatter.Commands.ModerationBan.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      permissions: [Permissions.BAN_MEMBERS],
      permissionsClient: [Permissions.BAN_MEMBERS, Permissions.EMBED_LINKS],
      options: [
        {
          name: 'users',
          description: 'Users to ban (Mentions or User IDs, separated by spaces)',
          required: true,
          value: Parameters.Slash.banPayload(),
        },
        {name: 'reason', description: 'Reason (shown in the Audit Log)'},
        {
          name: 'clean',
          description: 'Delete their recent messages (Default: Previous 24 Hours)',
          choices: CLEAN_CHOICES,
          default: 24 * 60 * 60,
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
      content: `${StatusEmojis.WARNING} Couldn\'t find any users. (Use Mentions or User IDs)`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationBan.createMessage(context, {
      clean: args.clean,
      payload: {...args.users, text: args.reason || ''},
    });
  }
}
