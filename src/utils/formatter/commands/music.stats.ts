import { Command, Interaction } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusicStats } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { MusicStatsPeriods, MusicStatsSorts } from '../../../constants';
import { DisplayPayload, Paginator, chunkArray, displayDetails, displayDetailsLine, displayReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { musicItemTitle } from './music.shared';


// entries per top list the api is asked for, and per page of a list
const RESULTS_PER_LIST = 30;
const RESULTS_PER_PAGE = 10;
// entries per list on the overview
const RESULTS_OVERVIEW = 5;

export const COMMAND_ID = 'music.stats';

export interface CommandArgs {
  period?: MusicStatsPeriods | null,
  sort?: MusicStatsSorts | null,
}

// a long time in its two largest units (`41d 6h`, `3h 12m`), seconds only under a minute
function formatPlayedTime(ms: number, language: string): string {
  const seconds = Math.max(Math.floor(ms / 1000), 0);
  const units: Array<[string, number]> = [
    ['days', Math.floor(seconds / 86400)],
    ['hours', Math.floor(seconds / 3600) % 24],
    ['minutes', Math.floor(seconds / 60) % 60],
  ];
  const first = units.findIndex(([, value]) => value);
  if (first === -1) {
    return new Intl.DurationFormat(language, {style: 'narrow', secondsDisplay: 'always'}).format({seconds});
  }
  const duration = Object.fromEntries(units.slice(first, first + 2).filter(([, value]) => value));
  return new Intl.DurationFormat(language, {style: 'narrow'}).format(duration);
}

// what the server's music played over a period (all of it by default): totals, then the top tracks, members (by what
// they queued) and artists, by plays or time played, with how often a loop played them again. Counted by the api since it
// started recording them
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { language, translate } = await getTranslator(context);

  const period = args.period || MusicStatsPeriods.ALL;
  const sort = args.sort || MusicStatsSorts.PLAYS;
  const guildId = context.guildId;
  const stats = (guildId) ? await fetchGuildMusicStats(context, guildId, {limit: RESULTS_PER_LIST, period, sort}) : null;
  if (!stats || !stats.totals.played_ms) {
    return displayReply(context, {
      description: translate((period === MusicStatsPeriods.ALL) ? 'music_stats.empty' : 'music_stats.empty_period'),
    });
  }

  // loops playing songs again, only when there were some
  const repeats = (item: RestResponsesRaw.GuildMusicStatsCounts): null | string => {
    return (item.repeats) ? translate('music_stats.repeats', {count: item.repeats.toLocaleString(language)}) : null;
  };
  const counts = (item: RestResponsesRaw.GuildMusicStatsCounts): string => {
    return displayDetailsLine([
      translate('music_stats.plays', {count: item.plays.toLocaleString(language)}),
      repeats(item),
      translate('music_stats.played', {duration: formatPlayedTime(item.played_ms, language)}),
    ], true);
  };
  const entry = (title: string, index: number, item: RestResponsesRaw.GuildMusicStatsCounts): string => {
    return displayDetails([`\`${index + 1}.\` ${title}`, counts(item)]);
  };
  const lists: Array<{name: string, entries: Array<string>}> = [
    {name: translate('music_stats.top_tracks'), entries: stats.tracks.map((x, i) => entry(musicItemTitle(x), i, x))},
    {name: translate('music_stats.top_listeners'), entries: stats.users.map((x, i) => entry(`<@${x.user_id}>`, i, x))},
    {name: translate('music_stats.top_artists'), entries: stats.artists.map((x, i) => entry(Markup.escape.all(x.name), i, x))},
  ].filter((x) => x.entries.length);

  const { totals } = stats;
  const overview = displayDetails([
    displayDetailsLine([
      Markup.bold(translate('music_stats.plays', {count: totals.plays.toLocaleString(language)})),
      repeats(totals),
      translate('music_stats.played', {duration: formatPlayedTime(totals.played_ms, language)}),
      translate('music_stats.tracks', {count: totals.tracks.toLocaleString(language)}),
      translate('music_stats.listeners', {count: totals.users.toLocaleString(language)}),
    ]),
    // a period says how far back in the header instead
    (period === MusicStatsPeriods.ALL && totals.first_played) ? displayDetailsLine([
      translate('music_stats.since', {date: Markup.timestamp(totals.first_played, MarkupTimestampStyles.DATE_LONG)}),
    ], true) : null,
    ...lists.map((x) => `\n${Markup.bold(x.name)}\n${x.entries.slice(0, RESULTS_OVERVIEW).join('\n')}`),
  ]);

  // the overview, then each list in full
  const pages: Array<string> = [overview];
  for (const list of lists) {
    for (const chunk of chunkArray(list.entries, RESULTS_PER_PAGE)) {
      pages.push(`${Markup.bold(list.name)}\n${chunk.join('\n')}`);
    }
  }

  const header = (period === MusicStatsPeriods.ALL) ?
    translate('music_stats.title') :
    translate('music_stats.title_period', {period: translate(`music_stats.period_${period}`)});
  const pageDisplay = (pageNumber: number): DisplayPayload => {
    return {
      description: pages[pageNumber - 1] || '',
      footer: displayDetailsLine([
        (sort === MusicStatsSorts.TIME) ? translate('music_stats.by_time') : translate('music_stats.by_plays'),
        (pages.length !== 1) ? translate('common.page_of', {page: pageNumber, total: pages.length}) : null,
      ]),
      header,
    };
  };
  const paginator = new Paginator(context, {
    pageLimit: pages.length,
    onPage: (pageNumber) => ({display: pageDisplay(pageNumber)}),
  });
  return await paginator.start();
}
