import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildTimedBans } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import { getTranslator } from '../../i18n';
import { DisplayPayload, Paginator, chunkArray, displayReply, formatUserTag } from '../../../utils';


export const COMMAND_ID = 'server.bans';

export const BANS_PER_PAGE = 10;
// discord sends 1000 bans per request, servers with more than this only get the first ones listed (timed ones always show)
export const MAX_BANS = 5000;

export interface CommandArgs {
  // only the ones the bot will lift later (`ban -for`)
  timed?: boolean,
}

interface BanEntry {
  ban: Structures.GuildBan | null,
  timedBan: RestResponsesRaw.TimedBan | null,
  userId: string,
}

export async function fetchBans(
  context: Command.Context | Interaction.InteractionContext,
  guildId: string,
): Promise<{bans: Array<Structures.GuildBan>, complete: boolean}> {
  const bans: Array<Structures.GuildBan> = [];
  let after: string | undefined;
  while (bans.length < MAX_BANS) {
    const page = (await context.rest.fetchGuildBans(guildId, {after, limit: 1000})).toArray();
    bans.push(...page);
    if (page.length < 1000) {
      return {bans, complete: true};
    }
    after = page[page.length - 1].user.id;
  }
  return {bans, complete: false};
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const guildId = context.guildId!;

  // a server can only have 200 timed bans, so one request gets all of them (soonest first)
  const { timed_bans: timedBans } = await fetchGuildTimedBans(context, guildId);

  const entries: Array<BanEntry> = [];
  let complete = true;
  if (args.timed) {
    // straight from the api, no need to page through every ban on discord for these
    for (let timedBan of timedBans) {
      entries.push({ban: null, timedBan, userId: timedBan.user_id});
    }
  } else {
    const result = await fetchBans(context, guildId);
    complete = result.complete;
    const bansByUserId = new Map(result.bans.map((ban) => [ban.user.id, ban]));
    // timed ones first, soonest to be lifted on top
    for (let timedBan of timedBans) {
      const ban = bansByUserId.get(timedBan.user_id) || null;
      // not in a complete list means they're not banned anymore and the scheduler is about to clean it up
      if (ban || !complete) {
        entries.push({ban, timedBan, userId: timedBan.user_id});
      }
      bansByUserId.delete(timedBan.user_id);
    }
    for (let [userId, ban] of bansByUserId) {
      entries.push({ban, timedBan: null, userId});
    }
  }

  if (!entries.length) {
    const key = (args.timed) ? 'server_bans.none_timed' : 'server_bans.none';
    return displayReply(context, {description: translate(key)});
  }

  const pages = chunkArray<BanEntry>(entries, BANS_PER_PAGE);
  const pageLimit = pages.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (page) => {
      const description: Array<string> = [];
      for (let { ban, timedBan, userId } of pages[page - 1]) {
        const name = (ban) ? Markup.escape.all(formatUserTag(ban.user)) : `<@${userId}>`;
        description.push(`**${name}** (${userId})`);
        if (timedBan) {
          const unix = Math.floor(Date.parse(timedBan.timestamp_end) / 1000);
          description.push(`-> ${translate('server_bans.timed', {
            moderator: `<@${timedBan.moderator_id}>`,
            timestamp: `<t:${unix}:f> (<t:${unix}:R>)`,
          })}`);
        }
        if (ban && ban.reason) {
          description.push(`-> ${translate('server_bans.reason', {text: Markup.escape.all(ban.reason.slice(0, 200))})}`);
        }
      }

      let footer: string;
      if (args.timed) {
        footer = translate('server_bans.footer_timed', {page, pageLimit, total: entries.length.toLocaleString(language)});
      } else if (complete) {
        footer = translate('server_bans.footer', {page, pageLimit, total: entries.length.toLocaleString(language)});
      } else {
        footer = translate('server_bans.footer_truncated', {page, pageLimit, total: entries.length.toLocaleString(language)});
      }

      const payload: DisplayPayload = {
        color: EmbedColors.DEFAULT,
        description: description.join('\n'),
        footer,
      };
      return {display: payload};
    },
  });
  return await paginator.start();
}
