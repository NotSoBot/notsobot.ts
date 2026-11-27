import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGamePointsUser } from '../../../api';
import { GAME_POINTS_DAILY_CAP, GamePointsGames } from '../../../constants';
import { displayDetail, displayDetails, displayReply } from '../../../utils';
import { getTranslator, TranslationKey } from '../../i18n';


export const COMMAND_ID = 'games.points';

// each game's line under the totals, in this order
export const GAME_NAMES: Record<GamePointsGames, TranslationKey> = {
  [GamePointsGames.FLAG_GUESSER]: 'games_points.game.flag_guesser',
  [GamePointsGames.LETTER_TRAIL]: 'games_points.game.letter_trail',
};

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

// someone's global game points: their total, this week's, their ranks and what each game gave. The server rank only in a
// server (a user install's too, the api ranks by where points were earned)
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const user = args.user;
  const response = await fetchGamePointsUser(context, user.id, {guildId: context.guildId});
  if (!response.total) {
    return displayReply(context, {
      description: translate('games_points.none', {user: `<@${user.id}>`}),
    });
  }

  const points = (value: number) => translate('games_points.points', {points: value.toLocaleString(language)});
  const rank = (value: number) => `#${value.toLocaleString(language)}`;
  const games = Object.entries(GAME_NAMES).filter(([ game ]) => response.games[game as GamePointsGames]);
  return displayReply(context, {
    description: displayDetails([
      displayDetail(translate('games_points.total'), Markup.bold(points(response.total))),
      displayDetail(translate('games_points.this_week'), points(response.week)),
      (response.rank.guild) ? displayDetail(translate('games_points.server_rank'), rank(response.rank.guild)) : null,
      (response.rank.global) ? displayDetail(translate('games_points.global_rank'), rank(response.rank.global)) : null,
      (games.length) ? `\n${Markup.bold(translate('games_points.by_game'))}` : null,
      ...games.map(([ game, key ]) => displayDetail(translate(key), points(response.games[game as GamePointsGames]!))),
    ]),
    footer: translate('games_points.footer', {cap: GAME_POINTS_DAILY_CAP.toLocaleString(language)}),
    header: translate('games_points.title'),
    thumbnail: user.avatarUrl,
    title: Markup.escape.all(user.name),
  });
}
