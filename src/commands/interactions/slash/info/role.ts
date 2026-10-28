import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'role';

export class InfoRoleCommand extends BaseInteractionCommandOption {
  description = 'Get information about a role';
  descriptionLocalizations = I18n.localizations('commands.info.role.description');
  metadata = {
    id: Formatter.Commands.InfoRole.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.role.name');

  constructor() {
    super({
      options: [
        {
          name: 'role',
          description: 'Role to get information for (Default: @everyone)',
          ...I18n.optionLocalizations('commands.info.role.role'),
          default: DefaultParameters.defaultRole,
          type: ApplicationCommandOptionTypes.ROLE,
        },
        {
          name: 'channel',
          description: 'Channel to check the role\'s permissions in (Default: Current Channel)',
          ...I18n.optionLocalizations('commands.info.role.channel'),
          default: DefaultParameters.channel,
          type: ApplicationCommandOptionTypes.CHANNEL,
          // discord's resolved channels don't include permission overwrites, so prefer our cached one
          value: (channel: Structures.Channel, context: Interaction.InteractionContext) => {
            return context.channels.get(channel.id) || channel;
          },
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoRole.CommandArgsBefore) {
    return !!args.channel && !!args.role;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoRole.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    const key = (args.role) ? 'errors.channel_not_found' : 'errors.role_not_found';
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate(key)}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.InfoRole.CommandArgs) {
    return Formatter.Commands.InfoRole.createMessage(context, args);
  }
}
