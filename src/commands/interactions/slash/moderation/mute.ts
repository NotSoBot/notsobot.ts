import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  duration: number,
  reason?: string,
  users: Parameters.BanPayloadMembersOnly,
}

export const COMMAND_NAME = 'mute';

export class ModerationMuteCommand extends BaseInteractionCommandOption {
  description = 'Time out multiple members with a reason';
  descriptionLocalizations = I18n.localizations('commands.moderation.mute.description');
  metadata = {
    id: Formatter.Commands.ModerationMute.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.mute.name');

  constructor() {
    super({
      permissions: [Permissions.MODERATE_MEMBERS],
      permissionsClient: [Permissions.MODERATE_MEMBERS],
      options: [
        {
          name: 'users',
          description: 'Members to mute (Mentions or User IDs, separated by spaces)',
          ...I18n.optionLocalizations('commands.moderation.mute.users'),
          required: true,
          value: Parameters.Slash.banPayload({membersOnly: true}),
        },
        {
          name: 'duration',
          description: 'How long, like 10m, 2 hours, or 3 days (Default: 1 hour, Max: 28 days)',
          ...I18n.optionLocalizations('commands.moderation.mute.duration'),
          default: Formatter.Commands.ModerationMute.DEFAULT_DURATION,
          value: Parameters.secondsWithOptions({float: false}),
        },
        {name: 'reason', description: 'Reason (shown in the Audit Log and sent to them)', ...I18n.optionLocalizations('commands.moderation.mute.reason')},
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
    return Formatter.Commands.ModerationMute.createMessage(context, {
      duration: args.duration,
      payload: {...args.users, text: args.reason || ''},
    });
  }
}
