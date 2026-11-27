import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


// someone's global game points, every game adds to the same total
export class GamesPointsCommand extends BaseInteractionCommandOption {
  description = 'See someone\'s points from every NotSoBot game and where they rank';
  descriptionLocalizations = I18n.localizations('commands.games.points.description');
  metadata = {
    id: Formatter.Commands.GamesPoints.COMMAND_ID,
  };
  name = 'points';
  nameLocalizations = I18n.localizations('commands.games.points.name');

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'Whose points to show (Default: You)',
          ...I18n.optionLocalizations('commands.games.points.user'),
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
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`, ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.GamesPoints.CommandArgs) {
    return Formatter.Commands.GamesPoints.createMessage(context, args);
  }
}
