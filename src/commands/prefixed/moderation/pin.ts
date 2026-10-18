import { Command, CommandClient, Interaction, Structures } from 'detritus-client';
import { ChannelTypes, DiscordRegexNames, Permissions } from 'detritus-client/lib/constants';
import { Markup, regex as discordRegex } from 'detritus-client/lib/utils';
import moment from 'moment';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, I18n, Parameters, displayReply, formatUserForAuditLog, getTimezoneFromContext } from '../../../utils';

import { formatPermissions, replyWarning } from '../../errors';
import { BaseCommand } from '../basecommand';

import { getCommandPrefixes, isCommandContent } from './clean';
import { snowflakeFromTimestamp } from './prune';


// discord returns a 202 with `retry_after` while it's still indexing the server for search
export const SEARCH_INDEX_NOT_READY_CODE = 110000;
export const SEARCH_LIMIT = 25;
export const SEARCH_MAX_WAIT = 5;

// no `moment.ISO_8601`, it accepts a bare year so searching for "2024" would turn into a date
export const DATE_FORMATS = [
  'YYYY-M-D', 'YYYY/M/D', 'M-D-YYYY', 'M/D/YYYY',
].flatMap((format) => {
  // strict parsing wants `MM` for `05` and `M` for `5`, so allow both
  const padded = format.replace('M', 'MM').replace('D', 'DD');
  return [format, padded, `${format} HH:mm`, `${padded} HH:mm`];
}).concat([
  'YYYY-MM-DDTHH:mm',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mm:ssZ',
]);

export interface CommandArgsBefore {
  first?: boolean,
  in?: Structures.Channel | null,
  query: string,
}

export interface CommandArgs {
  first?: boolean,
  in?: Structures.Channel,
  query: string,
}

export const COMMAND_ID = 'moderation.pin';
export const COMMAND_NAME = 'pin';

export default class PinCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'first', type: Boolean},
        {name: 'in', default: DefaultParameters.channel, type: Parameters.channel({
          types: [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_NEWS],
        })},
      ],
      disableDm: true,
      label: 'query',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Pin a message by its ID or link, the first message on or after a date, or the latest message containing some text',
        examples: [
          `${COMMAND_NAME} 1240414316425789460`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1240414316425789460`,
          `${COMMAND_NAME} 2024-05-14`,
          `${COMMAND_NAME} welcome to the server`,
          `${COMMAND_NAME} rules -in general`,
          `${COMMAND_NAME} -first`,
        ],
        id: COMMAND_ID,
        usage: '<message_id|message_link|date|text> (-first) (-in <channel:id|mention|name>)',
      },
      permissionsClient: [Permissions.PIN_MESSAGES],
      permissions: [Permissions.PIN_MESSAGES],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.in === null) {
      return false;
    }
    return !!args.first || !!args.query;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.in === null) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.channel_not_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    return createPinMessage(context, args);
  }
}


// strict formats only, anything chrono-ish like "meeting at 5" should stay a text search
export function parseDate(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): number | null {
  const timezone = getTimezoneFromContext({guildId: context.guildId, userId: context.userId});
  const date = moment.tz(value, DATE_FORMATS, true, timezone);
  return (date.isValid()) ? date.valueOf() : null;
}

export async function createPinMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await I18n.getTranslator(context);
  const { translate } = translator;
  const guildId = context.guildId!;
  const query = (args.query || '').trim();

  let channelId = (args.in) ? args.in.id : context.channelId!;
  let messageId: string | null = null;
  // message id to look after (the first message on/after a date, or the very first message)
  let after: string | null = null;
  let date: number | null = null;

  if (args.first) {
    after = '0';
  } else {
    const { matches } = discordRegex(DiscordRegexNames.JUMP_CHANNEL_MESSAGE, query) as {matches: Array<{channelId: string, guildId: string, messageId: string}>};
    if (matches.length && matches[0].channelId && matches[0].messageId) {
      if (matches[0].guildId !== guildId) {
        return replyWarning(context, translate('pin.other_server'));
      }
      channelId = matches[0].channelId;
      messageId = matches[0].messageId;
    } else if (/^\d{15,21}$/.test(query)) {
      messageId = query;
    } else {
      date = parseDate(query, context);
      if (date !== null) {
        // `after` is exclusive, so go back a millisecond to include messages sent exactly at the date
        after = snowflakeFromTimestamp(Math.max(date - 1, 1420070400000));
      }
    }
  }

  // command permissions are only checked in the channel the command was used in, so check the target channel ourselves
  const channel = context.channels.get(channelId);
  if (!channel || channel.guildId !== guildId || !context.member) {
    return replyWarning(context, translate('errors.channel_not_found'));
  }
  if (channel.id !== context.channelId) {
    const command = `${Markup.codestring(COMMAND_NAME)} -> ${channel.mention}`;
    const required = [Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY, Permissions.PIN_MESSAGES];
    const failedUser = required.filter((permission) => !channel.can(permission, context.member!));
    if (failedUser.length) {
      return replyWarning(context, translate('errors.prefix_user_missing_permissions', {
        command,
        permissions: formatPermissions(failedUser, translator),
      }));
    }
    const failedBot = required.filter((permission) => !channel.can(permission));
    if (failedBot.length) {
      return replyWarning(context, translate('errors.prefix_bot_missing_permissions', {
        command,
        permissions: formatPermissions(failedBot, translator),
      }));
    }
  }

  let target: {authorId: string, id: string, pinned: boolean} | null = null;
  if (messageId) {
    try {
      const message = await context.rest.fetchMessage(channelId, messageId);
      target = {authorId: message.author.id, id: message.id, pinned: message.pinned};
    } catch(error) {
      return replyWarning(context, translate('pin.not_found_id', {channel: channel.mention}));
    }
  } else if (after !== null) {
    const messages = await context.rest.fetchMessages(channelId, {after, limit: 1});
    const message = messages.first();
    if (!message) {
      if (args.first) {
        return replyWarning(context, translate('pin.not_found_first', {channel: channel.mention}));
      }
      return replyWarning(context, translate('pin.not_found_date', {channel: channel.mention, date: Markup.codestring(query)}));
    }
    target = {authorId: message.author.id, id: message.id, pinned: message.pinned};
  } else {
    const prefixes = await getCommandPrefixes(context);
    const userId = context.client.userId;
    // the command message itself contains the text
    const maxId = (context instanceof Command.Context) ? BigInt(context.messageId) : null;
    // skip our own responses and other people's `pin <text>` commands, those all contain the text too
    const isCandidate = (authorId: string, authorBot: boolean, content: string) => {
      if (authorId === userId) {
        return false;
      }
      return authorBot || !isCommandContent(context, prefixes, content);
    };

    // check the cached messages first (newest first), only hit the search endpoint if none of them match
    const insensitive = query.toLowerCase();
    const cached = channel.messages.toArray()
      .filter((message) => maxId === null || BigInt(message.id) < maxId)
      .sort((x, y) => (BigInt(y.id) < BigInt(x.id)) ? -1 : 1)
      .find((message) => {
        if (!message.content.toLowerCase().includes(insensitive)) {
          return false;
        }
        return isCandidate(message.author.id, message.author.bot, message.content);
      });

    if (cached) {
      target = {authorId: cached.author.id, id: cached.id, pinned: cached.pinned};
    } else {
      let body: any = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        body = await context.rest.searchGuild(guildId, {
          channelId,
          content: query.slice(0, 1024),
          includeNSFW: !!channel.nsfw,
          limit: SEARCH_LIMIT,
          maxId: (maxId === null) ? undefined : String(maxId),
          sortBy: 'timestamp',
          sortOrder: 'desc',
        }, false);
        if (!body || body.code !== SEARCH_INDEX_NOT_READY_CODE || attempt) {
          break;
        }
        const wait = Math.min(Math.max(body.retry_after || 1, 1), SEARCH_MAX_WAIT);
        await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      }
      if (!body || body.code === SEARCH_INDEX_NOT_READY_CODE) {
        return replyWarning(context, translate('pin.search_not_ready'));
      }

      const results: Array<any> = (Array.isArray(body.messages)) ? body.messages.map((x: any) => (Array.isArray(x)) ? x[0] : x) : [];
      const found = results.find((raw) => {
        if (!raw || !raw.author || raw.channel_id !== channelId) {
          return false;
        }
        return isCandidate(raw.author.id, !!raw.author.bot, raw.content || '');
      });
      if (!found) {
        return replyWarning(context, translate('pin.not_found_text', {channel: channel.mention}));
      }
      target = {authorId: found.author.id, id: found.id, pinned: !!found.pinned};
    }
  }

  const jumpLink = `https://discord.com/channels/${guildId}/${channelId}/${target.id}`;
  if (target.pinned) {
    return displayReply(context, {description: translate('pin.already_pinned', {url: jumpLink})});
  }

  try {
    // in the server's language since the whole server sees it
    const reason = (await I18n.getGuildTranslator(context)).translate('pin.audit_reason', {user: formatUserForAuditLog(context.user)});
    await context.rest.addPinnedMessage(channelId, target.id, {reason});
  } catch(error) {
    const text = Markup.codestring(String((error && (error as any).message) || error).slice(0, 100));
    return replyWarning(context, translate('pin.failed', {error: text}));
  }
  return displayReply(context, {description: translate('pin.pinned', {url: jumpLink, user: `<@${target.authorId}>`})});
}
