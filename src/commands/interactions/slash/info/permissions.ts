import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'permissions';

export class InfoPermissionsCommand extends BaseInteractionCommandOption {
  description = 'See a member\'s or role\'s permissions in a channel or the server';
  descriptionLocalizations = I18n.localizations('commands.info.permissions.description');
  metadata = {
    id: Formatter.Commands.InfoPermissions.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.permissions.name');

  constructor() {
    super({
      options: [
        {
          name: 'target',
          description: 'Member or role to check (Default: You)',
          ...I18n.optionLocalizations('commands.info.permissions.target'),
          default: DefaultParameters.author,
          type: ApplicationCommandOptionTypes.MENTIONABLE,
          // prefer our cached member/role, the resolved member's permissions are only for the channel it was used in
          value: (target: Structures.Member | Structures.Role | Structures.User, context: Interaction.InteractionContext) => {
            const { guild } = context;
            if (guild) {
              if (target instanceof Structures.Role) {
                return guild.roles.get(target.id) || target;
              }
              return guild.members.get(target.id) || target;
            }
            return target;
          },
        },
        {
          name: 'channel',
          description: 'Channel to check the permissions in (Default: Current Channel)',
          ...I18n.optionLocalizations('commands.info.permissions.channel'),
          default: DefaultParameters.channel,
          type: ApplicationCommandOptionTypes.CHANNEL,
          // discord's resolved channels don't include permission overwrites, so prefer our cached one
          value: (channel: Structures.Channel, context: Interaction.InteractionContext) => {
            return context.channels.get(channel.id) || channel;
          },
        },
        {
          name: 'server',
          description: 'Show the server-wide permissions instead of a channel\'s',
          ...I18n.optionLocalizations('commands.info.permissions.server'),
          type: ApplicationCommandOptionTypes.BOOLEAN,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoPermissions.CommandArgsBefore) {
    return (
      !!context.guild &&
      !!args.channel &&
      Formatter.Commands.InfoPermissions.canViewChannel(context, args.channel) &&
      (args.target instanceof Structures.Member || args.target instanceof Structures.Role)
    );
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoPermissions.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    let key: I18n.TranslationKey;
    if (!context.guild) {
      // a dm, or a server the bot isn't in (user installs), there's nothing cached to work it out from
      key = 'errors.guild_not_found';
    } else if (!args.channel || !Formatter.Commands.InfoPermissions.canViewChannel(context, args.channel)) {
      // a channel they can't see gets the same reply as one that doesn't exist
      key = 'errors.channel_not_found';
    } else if (args.target instanceof Structures.User) {
      key = 'errors.member_not_in_server';
    } else {
      key = 'errors.member_or_role_not_found';
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate(key)}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.InfoPermissions.CommandArgs) {
    return Formatter.Commands.InfoPermissions.createMessage(context, args);
  }
}
