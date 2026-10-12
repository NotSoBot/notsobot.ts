import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, MessageFlags } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'user';

export class InfoUserCommand extends BaseInteractionCommandOption {
  description = 'Get information about a user';
  descriptionLocalizations = I18n.localizations('commands.info.user.description');
  metadata = {
    id: Formatter.Commands.InfoUser.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.user.name');

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to get information about (Default: You)',
          ...I18n.optionLocalizations('commands.info.user.user'),
          default: DefaultParameters.author,
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {user: Structures.Member | Structures.User | null}) {
    return !!args.user;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: {user: Structures.Member | Structures.User | null}) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: {user: Structures.Member | Structures.User}) {
    return Formatter.Commands.InfoUser.createMessage(context, args);
  }
}
