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
        (options.post && response.post) ? formatPost(translator, response.post, {spoiler: !!args.spoiler}).above : undefined,
        describeQuality(response),
      ].filter(Boolean);
      return (lines.length) ? lines.join('\n') : undefined;
    },
    describeBelow: (response) => (options.post && response.post) ? formatPost(translator, response.post, {spoiler: !!args.spoiler}).below : undefined,
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
  const post = (showText && response.post) ? formatPost(await getTranslator(context), response.post, {spoiler}) : {};
  const reply = await mediaReply(context, response, {description: post.above, descriptionBelow: post.below, spoiler});
  await suppressLinkEmbed(context);
  return reply;
}


// the counts in the order they're shown, what people react with first and how far it went last
const POST_STATS: Array<RestResponsesRaw.FetchMediaPostStat> = ['likes', 'upvotes', 'notes', 'saves', 'reposts', 'comments', 'views'];

// a post's text isn't ours, keep it from restyling the reply (`# heading`, `-# subtext`, lists), one line at a time
// since the escapes join lines. it can't ping anyone, replies don't allow mentions
function quotePostText(text: string, spoiler: boolean): string {
  return text.split('\n').map((line) => {
    line = (line.trim()) ? Markup.escape.subtext(Markup.escape.header(Markup.escape.list(line.trimEnd()))) : '';
    return (line && spoiler) ? `> ||${line}||` : `> ${line}`;
  }).join('\n');
}

export interface FormattedPost {
  // above the media: what it is and who posted it, then its text
  above?: string,
  // under the media: where it's from, when, and its counts
  below?: string,
}

// a post around its downloaded media. titled posts (videos, reddit) like a `.yt` result, the rest like a link preview:
// ### [Title](<post>)              **Name** ([@handle](<profile>))
// -# Uploaded by [Name](<profile>) > the text
// > the text
// [media]
// -# [TikTok](<post>) • 2 hours ago • 12.4K likes • 340 comments • 1.1M views
export function formatPost(
  translator: Translator,
  post: RestResponsesRaw.FetchMediaPost,
  options: {spoiler?: boolean} = {},
): FormattedPost {
  const { language, translate } = translator;
  const above: Array<string> = [];

  const name = (post.author_name) ? Markup.escape.all(post.author_name) : null;
  const handle = (post.author_username) ? Markup.escape.all(`@${post.author_username}`) : null;
  const link = (text: string) => (post.author_url) ? Markup.url(text, `<${post.author_url}>`) : text;
  if (post.title) {
    const title = Markup.escape.all(post.title);
    above.push(`### ${(post.url) ? Markup.url(title, `<${post.url}>`) : title}`);
    if (name || handle) {
      // small, the title is what matters
      above.push(`-# ${translate('search_youtube.uploaded_by', {name: link((name || handle)!)})}`);
    }
  } else if (name && handle) {
    above.push(`**${name}** (${link(handle)})`);
  } else if (name || handle) {
    above.push(`**${link((name || handle)!)}**`);
  }
  if (post.text) {
    above.push(quotePostText(post.text, !!options.spoiler));
  }

  const below: Array<string> = [];
  if (post.site) {
    const site = Markup.escape.all(post.site);
    below.push((post.url) ? Markup.url(site, `<${post.url}>`) : site);
  }
  if (post.timestamp) {
    below.push(Markup.timestamp(post.timestamp * 1000, MarkupTimestampStyles.RELATIVE));
  }
  below.push(...formatPostStats(language, translate, post.stats));

  return {
    above: (above.length) ? above.join('\n') : undefined,
    below: (below.length) ? `-# ${below.join(' • ')}` : undefined,
  };
}

// `12.4K likes`, short numbers in their language. a 0 is real but just noise in a preview
function formatPostStats(
  language: string,
  translate: Translator['translate'],
  stats: RestResponsesRaw.FetchMediaPost['stats'],
): Array<string> {
  if (!stats) {
    return [];
  }
  let format: Intl.NumberFormat;
  try {
    format = new Intl.NumberFormat(language, {maximumFractionDigits: 1, notation: 'compact'});
  } catch(error) {
    format = new Intl.NumberFormat('en', {maximumFractionDigits: 1, notation: 'compact'});
  }
  return POST_STATS
    .filter((key) => typeof(stats[key]) === 'number' && 0 < stats[key]!)
    .map((key) => translate(`tools_embed.stat_${key}` as const, {count: format.format(stats[key]!)}));
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
