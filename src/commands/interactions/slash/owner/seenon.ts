import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, editOrReply } from '../../../../utils';

import { BaseOwnerCommandOption } from './base';


export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

export const COMMAND_NAME = 'seenon';

export class OwnerSeenOnCommand extends BaseOwnerCommandOption {
  description = 'Get guilds a user shares with NotSoBot';
  descriptionLocalizations = I18n.localizations('commands.owner.seenon.description');
  metadata = {
    id: Formatter.Commands.OwnerSeenOn.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.seenon.name');

  constructor() {
    super({
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {
          name: 'user',
          description: 'User to check (Default: You)',
          ...I18n.optionLocalizations('commands.owner.seenon.user'),
          default: DefaultParameters.author,
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.user) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`);
    }
    if (args.user.bot) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.no_bots')}`);
    }

    const payload = await Formatter.Commands.OwnerSeenOn.getSharedGuilds(args.user.id, context);
    if (!payload.user || !payload.results.length) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('owner.no_shared_guilds')}`);
    }
    return Formatter.Commands.OwnerSeenOn.createMessage(context, {payload: payload as Formatter.Commands.OwnerSeenOn.CommandArgs['payload']});
  }
}
