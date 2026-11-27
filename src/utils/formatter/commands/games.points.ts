import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGamePointsUser } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { GAME_POINTS_DAILY_CAP, GamePointsGames } from '../../../constants';
import { displayDetail, displayDetails, displayDetailsLine, displayReply } from '../../../utils';
import { getTranslator, TranslationKey, Translator } from '../../i18n';


export const COMMAND_ID = 'games.points';

// each game's line under the totals, in this order
export const GAME_NAMES: Record<GamePointsGames, TranslationKey> = {
  [GamePointsGames.FLAG_GUESSER]: 'games_points.game.flag_guesser',
  [GamePointsGames.LETTER_TRAIL]: 'games_points.game.letter_trail',
};

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

// a game's record on one line, like `12W • 5L • 1T • 2 left • 63% wins • streak 3 (best 7)`: wins/losses once a game
// had opponents, the rest only when there are any. The win rate counts every game with opponents (left ones too)
function displayRecord(
  language: string,
  translate: Translator['translate'],
  entry: RestResponsesRaw.GameStatsEntry,
): string {
  const count = (value: number) => value.toLocaleString(language);
  const played = entry.wins + entry.losses + entry.ties + entry.left;
  const rate = (played) ? (entry.wins / played).toLocaleString(language, {
    maximumFractionDigits: 0,
    style: 'percent',
  }) : null;
  return displayDetailsLine([
    (played) && translate('games_points.record.wins', {count: count(entry.wins)}),
    (played) && translate('games_points.record.losses', {count: count(entry.losses)}),
    (entry.ties) && translate('games_points.record.ties', {count: count(entry.ties)}),
    (entry.left) && translate('games_points.record.left', {count: count(entry.left)}),
    (entry.solo) && translate('games_points.record.solo', {count: count(entry.solo)}),
    (rate) && translate('games_points.record.win_rate', {percent: rate}),
    (entry.best_win_streak) && translate('games_points.record.streak', {
      best: count(entry.best_win_streak),
      streak: count(entry.win_streak),
    }),
  ]);
}

// a game's own stats as small text, missing ones are skipped
function displayGameStats(
  language: string,
  translate: Translator['translate'],
  game: GamePointsGames,
  entry: RestResponsesRaw.GameStatsEntry,
): string {
  const stats = entry.stats;
  const count = (key: TranslationKey, value: number | undefined) => {
    return (value !== undefined) ? displayDetail(translate(key), value.toLocaleString(language)) : null;
  };
  const details: Array<null | string> = [];
  switch (game) {
    case GamePointsGames.FLAG_GUESSER: {
      details.push(
        count('games_points.stats.named', stats.named),
        count('games_points.stats.firsts', stats.firsts),
        count('games_points.stats.best_streak', stats.best_streak),
      );
      if (stats.fastest_ms !== undefined) {
        const seconds = (stats.fastest_ms / 1000).toLocaleString(language, {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
        });
        const fastest = translate('games_points.stats.seconds', {seconds});
        details.push(displayDetail(translate('games_points.stats.fastest'), fastest));
      }
    }; break;
    case GamePointsGames.LETTER_TRAIL: {
      details.push(
        count('games_points.stats.words', stats.words),
        count('games_points.stats.only_you', stats.only_you),
        (stats.longest_word) ? displayDetail(
          translate('games_points.stats.longest_word'),
          Markup.escape.all(stats.longest_word),
        ) : null,
      );
    }; break;
  }
  details.push(count('games_points.stats.best_score', stats.best_score));
  return displayDetailsLine(details, true);
}

// someone's global game points: their total, this week's, their ranks and what each game gave, with each game's record
// and stats once they finished a room game of it. The server rank only in a server (a user install's too, the api ranks
// by where points were earned)
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const user = args.user;
  const response = await fetchGamePointsUser(context, user.id, {guildId: context.guildId});
  // a game shows with points or a recorded game (one played to its end can give 0 points)
  const games = (Object.keys(GAME_NAMES) as Array<GamePointsGames>).filter((game) => {
    return response.games[game] || response.stats[game].games;
  });
  if (!response.total && !games.length) {
    return displayReply(context, {
      description: translate('games_points.none', {user: `<@${user.id}>`}),
    });
  }

  const points = (value: number) => translate('games_points.points', {points: value.toLocaleString(language)});
  const rank = (value: number) => `#${value.toLocaleString(language)}`;
  return displayReply(context, {
    description: displayDetails([
      displayDetail(translate('games_points.total'), Markup.bold(points(response.total))),
      displayDetail(translate('games_points.this_week'), points(response.week)),
      (response.rank.guild) ? displayDetail(translate('games_points.server_rank'), rank(response.rank.guild)) : null,
      (response.rank.global) ? displayDetail(translate('games_points.global_rank'), rank(response.rank.global)) : null,
      (games.length) ? `\n${Markup.bold(translate('games_points.by_game'))}` : null,
      ...games.flatMap((game) => {
        const entry = response.stats[game];
        return [
          displayDetail(translate(GAME_NAMES[game]), points(response.games[game] || 0)),
          (entry.games) ? displayRecord(language, translate, entry) : null,
          (entry.games) ? displayGameStats(language, translate, game, entry) : null,
        ];
      }),
    ]),
    footer: translate('games_points.footer', {cap: GAME_POINTS_DAILY_CAP.toLocaleString(language)}),
    header: translate('games_points.title'),
    thumbnail: user.avatarUrl,
    title: Markup.escape.all(user.name),
  });
}
