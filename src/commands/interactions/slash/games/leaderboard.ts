import { Interaction } from 'detritus-client';

import { GamePointsPeriods, GamePointsScopes } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


// the top players by global game points, this server's or everyone's
export class GamesLeaderboardCommand extends BaseInteractionCommandOption {
  description = 'The top players by points from every NotSoBot game';
  descriptionLocalizations = I18n.localizations('commands.games.leaderboard.description');
  metadata = {
    id: Formatter.Commands.GamesLeaderboard.COMMAND_ID,
  };
  name = 'leaderboard';
  nameLocalizations = I18n.localizations('commands.games.leaderboard.name');

  constructor() {
    super({
      options: [
        {
          name: 'where',
          description: 'This server\'s board or everyone\'s',
          ...I18n.optionLocalizations('commands.games.leaderboard.where'),
          // a dm has no server board, it shows the global one
          choices: Parameters.Slash.oneOf({
            choices: GamePointsScopes,
            defaultChoice: GamePointsScopes.SERVER,
            doNotSort: true,
            localizationKey: 'choices.games_leaderboard_where',
          }),
        },
        {
          name: 'period',
          description: 'All time or only this week',
          ...I18n.optionLocalizations('commands.games.leaderboard.period'),
          choices: Parameters.Slash.oneOf({
            choices: GamePointsPeriods,
            defaultChoice: GamePointsPeriods.ALL,
            doNotSort: true,
            localizationKey: 'choices.games_leaderboard_period',
            descriptions: {
              [GamePointsPeriods.ALL]: 'All Time',
              [GamePointsPeriods.WEEK]: 'This Week',
            },
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.GamesLeaderboard.CommandArgs) {
    return Formatter.Commands.GamesLeaderboard.createMessage(context, args);
  }
}
