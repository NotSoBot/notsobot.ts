import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGamePointsLeaderboard, fetchGamePointsUser } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { GamePointsPeriods, GamePointsScopes } from '../../../constants';
import { displayDetail, displayDetails, displayDetailsLine, displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'games.leaderboard';

// places shown, and how far down the board the caller's own place is looked for before asking for their rank (a week's
// rank only comes from the board)
const PLACES_SHOWN = 10;
const PLACES_FETCHED = 25;

export interface CommandArgs {
  period?: GamePointsPeriods | null,
  where?: GamePointsScopes | null,
}

// the top 10 by global game points, this server's (points earned in it) or everyone's, all time or this week. The
// caller's own place goes under it when they aren't in it. A dm has no server board, it shows the global one
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const period = args.period || GamePointsPeriods.ALL;
  const guildId = context.guildId || null;
  const server = !!guildId && (args.where || GamePointsScopes.SERVER) === GamePointsScopes.SERVER;
  // the caller's own points with the board, not after it: most callers aren't on it and needed both, one after the
  // other. (a server's week board has no place past what it lists, nothing to ask.) Theirs failing only leaves their
  // line out
  const ownRequest = (period === GamePointsPeriods.WEEK && server) ? null :
    fetchGamePointsUser(context, context.userId, {guildId: (server) ? guildId : null}).catch(() => null);
  const board = await fetchGamePointsLeaderboard(context, {
    guildId: (server) ? guildId : null,
    limit: PLACES_FETCHED,
    period,
    scope: (server) ? 'guild' : 'global',
  });

  const points = (value: number) => translate('games_points.points', {points: value.toLocaleString(language)});
  const rank = (value: number) => `#${value.toLocaleString(language)}`;
  // a server's board mentions its members, the global one names people who mostly aren't in this server
  const name = (item: RestResponsesRaw.FetchGamePointsLeaderboard['items'][number]) => {
    return (server || !item.username) ? `<@${item.user_id}>` : Markup.escape.all(item.username);
  };

  const shown = board.items.slice(0, PLACES_SHOWN);
  const lines = shown.map((item) => {
    return displayDetailsLine([`**${item.rank.toLocaleString(language)}.** ${name(item)}`, points(item.points)]);
  });
  if (lines.length && !shown.some((item) => item.user_id === context.userId)) {
    const own = await formatOwnPlace(context, board, server, period, ownRequest, {points, rank, translate});
    if (own) {
      lines.push('', own);
    }
  }

  return displayReply(context, {
    description: (lines.length) ? displayDetails(lines) : translate((period === GamePointsPeriods.WEEK) ? 'games_leaderboard.empty_week' : 'games_leaderboard.empty'),
    footer: translate((period === GamePointsPeriods.WEEK) ? 'games_leaderboard.period_week' : 'games_leaderboard.period_all'),
    title: translate((server) ? 'games_leaderboard.title_server' : 'games_leaderboard.title_global'),
  });
}


// the caller's place under the board: from the rest of the fetched board, else their own rank (all time only, a week
// board has no rank past what it lists, the global one still says their points this week)
async function formatOwnPlace(
  context: Command.Context | Interaction.InteractionContext,
  board: RestResponsesRaw.FetchGamePointsLeaderboard,
  server: boolean,
  period: GamePointsPeriods,
  ownRequest: Promise<RestResponsesRaw.FetchGamePointsUser | null> | null,
  helpers: {
    points: (value: number) => string,
    rank: (value: number) => string,
    translate: Awaited<ReturnType<typeof getTranslator>>['translate'],
  },
): Promise<null | string> {
  const { points, rank, translate } = helpers;
  const label = translate('games_leaderboard.you');
  const listed = board.items.find((item) => item.user_id === context.userId);
  if (listed) {
    return displayDetail(label, displayDetailsLine([rank(listed.rank), points(listed.points)]));
  }
  const own = (ownRequest) ? await ownRequest : null;
  if (!own) {
    return null;
  }
  if (period === GamePointsPeriods.WEEK) {
    return (own.week) ? displayDetail(label, points(own.week)) : translate('games_leaderboard.you_none');
  }
  const place = (server) ? own.rank.guild : own.rank.global;
  if (!place) {
    return translate('games_leaderboard.you_none');
  }
  // a server board's points are what was earned in it, the api only gives the global total
  return displayDetail(label, displayDetailsLine([rank(place), (server) ? null : points(own.total)]));
}
