import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

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
  descriptionLocalizations = I18n.localizations('commands.moderation.kick.description');
  metadata = {
    id: Formatter.Commands.ModerationKick.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.kick.name');

  constructor() {
    super({
      permissions: [Permissions.KICK_MEMBERS],
      permissionsClient: [Permissions.BAN_MEMBERS, Permissions.KICK_MEMBERS],
      options: [
        {
          name: 'users',
          description: 'Members to kick (Mentions or User IDs, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.kick.users'),
          required: true,
          value: Parameters.Slash.banPayload({membersOnly: true}),
        },
        {name: 'reason', description: 'Reason (shown in the Audit Log)', ...I18n.optionLocalizations('commands.moderation.kick.reason')},
        {
          name: 'clean',
          description: 'Delete their recent messages (Default: Don\'t Delete Any)',
          ...I18n.optionLocalizations('commands.moderation.kick.clean'),
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

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationKick.createMessage(context, {
      clean: args.clean,
      payload: {...args.users, text: args.reason || ''},
    });
  }
}
