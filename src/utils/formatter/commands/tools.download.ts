import { Command, Interaction } from 'detritus-client';
import { MarkupTimestampStyles, MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';

import { utilitiesFetchMedia } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { CONTENT_BLOCKED_API_ERRORS, JobError, getApiError } from '../../../api/errors';
import { ApiErrorCodes, AutoEmbedReactions, DiscordReactionEmojis, DiscordSkuIds } from '../../../constants';
import { DefaultParameters, jobReply, jobWaitForResponse, linkPremiumSkuName, mediaReply } from '../../../utils';
import { getAutoEmbedLink } from '../../autoembed';
import { Translator, getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.download';


export interface CommandArgs {
  locale?: string,
  mediaFormat?: string,
  mediaPosition?: number,
  quality?: string,
  spoiler?: boolean,
  url: string,
}

export interface CreateMessageOptions {
  // `embed`: the post's author and text above the media too (when the site's downloader gave them)
  post?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  options: CreateMessageOptions = {},
) {
  const autoEmbed = (context instanceof Command.Context) ? getAutoEmbedLink(context) : null;
  const job = await utilitiesFetchMedia(context, {
    downloadQuality: args.quality,
    locale: args.locale,
    mediaFormat: args.mediaFormat,
    mediaPosition: args.mediaPosition,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
  if (autoEmbed) {
    return autoEmbedReply(context as Command.Context, job, autoEmbed.spoiler);
  }

  const translator = await getTranslator(context);
  const { translate } = translator;
  // the api only says when the cap picked the quality, so they don't have the tier that gets `best` (1440p is plus)
  const describeQuality = (response: RestResponsesRaw.FileResponse): string | undefined => {
    if (!response.download_quality) {
      return undefined;
    }
    const { best, capped, tier } = response.download_quality;
    if (tier === 'premium_plus') {
      const text = translate('tools_download.quality_upsell_plus', {best, quality: capped});
      return `-# ${linkPremiumSkuName(context, text, DiscordSkuIds.USER_NOTSOPREMIUM_PLUS)}`;
    }
    const text = translate('tools_download.quality_upsell', {best, quality: capped});
    return `-# ${linkPremiumSkuName(context, text, DiscordSkuIds.USER_NOTSOPREMIUM)}`;
  };
  return jobReply(context, job, {
    describe: (response) => {
      const lines = [
        (options.post && response.post) ? formatPost(translator, response.post, !!args.spoiler) : undefined,
        describeQuality(response),
      ].filter(Boolean);
      return (lines.length) ? lines.join('\n') : undefined;
    },
    spoiler: args.spoiler,
  });
}


// auto-embed: no thinking reply while it downloads (the typing indicator shows it's on it) and no upsell line, just the
// media, with the post's text above it when the server wants that. a failed job throws for `onRunError` to react with,
// then the link's own embed goes away since ours replaced it
async function autoEmbedReply(context: Command.Context, job: Parameters<typeof jobWaitForResponse>[1], spoiler: boolean) {
  const response = await jobWaitForResponse(context, job);
  const settings = (context.guildId) ? GuildSettingsStore.get(context.guildId) : null;
  const showText = !!(settings && settings.settings && settings.settings.autoEmbedText);
  const description = (showText && response.post) ? formatPost(await getTranslator(context), response.post, spoiler) : undefined;
  const reply = await mediaReply(context, response, {description, spoiler});
  await suppressLinkEmbed(context);
  return reply;
}


// a post's text isn't ours, keep it from restyling the reply (`# heading`, `-# subtext`, lists). it can't ping anyone,
// replies don't allow mentions
function escapePostText(text: string): string {
  return Markup.escape.subtext(Markup.escape.header(Markup.escape.list(text)));
}

// the order the counts are shown in, what people react with first and how far it went last
const POST_STATS: Array<RestResponsesRaw.FetchMediaPostStat> = ['likes', 'upvotes', 'notes', 'saves', 'reposts', 'comments', 'views'];

// `12.4K likes • 340 comments`, short numbers in their language. counts are from when it was downloaded
export function formatPostStats(translator: Translator, stats: RestResponsesRaw.FetchMediaPost['stats']): Array<string> {
  if (!stats) {
    return [];
  }
  let format: Intl.NumberFormat;
  try {
    format = new Intl.NumberFormat(translator.language, {maximumFractionDigits: 1, notation: 'compact'});
  } catch(error) {
    format = new Intl.NumberFormat('en', {maximumFractionDigits: 1, notation: 'compact'});
  }
  return POST_STATS
    // a 0 is real but just noise in a preview line
    .filter((key) => typeof(stats[key]) === 'number' && 0 < stats[key]!)
    .map((key) => translator.translate(`tools_embed.stat_${key}` as const, {count: format.format(stats[key]!)}));
}

// the post's author, text (quoted) and where it's from, like a link preview:
// **Name** ([@handle](<profile>))
// > the caption
// -# [TikTok](<post>) • 2 hours ago • 12.4K likes • 340 comments
export function formatPost(translator: Translator, post: RestResponsesRaw.FetchMediaPost, spoiler: boolean = false): string | undefined {
  const lines: Array<string> = [];

  const author: Array<string> = [];
  if (post.author_name) {
    author.push(Markup.bold(Markup.escape.all(post.author_name)));
  }
  if (post.author_username) {
    const handle = Markup.escape.all(`@${post.author_username}`);
    const text = (post.author_url) ? `[${handle}](<${post.author_url}>)` : handle;
    author.push((author.length) ? `(${text})` : text);
  }
  if (author.length) {
    lines.push(author.join(' '));
  }

  if (post.text) {
    // one line at a time, the escapes join lines
    for (let line of post.text.split('\n')) {
      line = (line.trim()) ? escapePostText(line.trimEnd()) : '';
      lines.push((line && spoiler) ? `> ||${line}||` : `> ${line}`);
    }
  }

  const footer: Array<string> = [];
  if (post.site) {
    footer.push((post.url) ? `[${Markup.escape.all(post.site)}](<${post.url}>)` : Markup.escape.all(post.site));
  }
  if (post.timestamp) {
    footer.push(Markup.timestamp(post.timestamp * 1000, MarkupTimestampStyles.RELATIVE));
  }
  footer.push(...formatPostStats(translator, post.stats));
  if (footer.length) {
    lines.push(`-# ${footer.join(' • ')}`);
  }
  return (lines.length) ? lines.join('\n') : undefined;
}


// hides discord's preview of the link on their message, which needs manage messages. only the embeds flag can be
// changed on someone else's message
async function suppressLinkEmbed(context: Command.Context): Promise<void> {
  const { channel, message } = context;
  if (!channel || !channel.canManageMessages || message.deleted) {
    return;
  }
  if ((message.flags & MessageFlags.SUPPRESS_EMBEDS) === MessageFlags.SUPPRESS_EMBEDS) {
    return;
  }
  try {
    await context.rest.editMessage(context.channelId, context.messageId, {flags: message.flags | MessageFlags.SUPPRESS_EMBEDS});
  } catch(error) {

  }
}


// what a failed auto-embed reacts with, from the api's error code
const TOO_LARGE_API_ERRORS: ReadonlyArray<ApiErrorCodes> = [
  ApiErrorCodes.FILE_TOO_LARGE,
  ApiErrorCodes.MEDIA_DIMENSIONS_TOO_LARGE,
  ApiErrorCodes.MEDIA_RESPONSE_TOO_LARGE,
  ApiErrorCodes.MEDIA_TOO_LONG,
  ApiErrorCodes.MEDIA_TOO_MANY_FRAMES,
];

export async function getAutoEmbedErrorReaction(error: any): Promise<string> {
  const apiError = (error instanceof JobError) ? error.apiError : await getApiError(error);
  if (apiError) {
    if (CONTENT_BLOCKED_API_ERRORS.includes(apiError.code)) {
      return AutoEmbedReactions.BLOCKED;
    }
    if (TOO_LARGE_API_ERRORS.includes(apiError.code)) {
      return AutoEmbedReactions.TOO_LARGE;
    }
    if (apiError.code === ApiErrorCodes.RATELIMITED) {
      return `${DiscordReactionEmojis.WAIT.name}:${DiscordReactionEmojis.WAIT.id}`;
    }
  }
  return AutoEmbedReactions.FAILED;
}


// an auto-embed never replies with an error, it reacts to the link instead (once per emoji)
export async function reactAutoEmbed(context: Command.Context, emoji: string): Promise<void> {
  const { message } = context;
  if (message.deleted || !message.canReact) {
    return;
  }
  try {
    await message.react(emoji);
  } catch(error) {

  }
}
