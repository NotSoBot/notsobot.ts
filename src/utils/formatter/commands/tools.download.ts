import { Command, Interaction } from 'detritus-client';
import { MarkupTimestampStyles, MessageFlags } from 'detritus-client/lib/constants';
import { ComponentContext, InteractionModalContext, Markup } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';

import GuildSettingsStore from '../../../stores/guildsettings';

import { utilitiesFetchMedia } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { CONTENT_BLOCKED_API_ERRORS, JobError, getApiError } from '../../../api/errors';
import {
  ApiErrorCodes,
  AutoEmbedReactions,
  DiscordEmojis,
  DiscordReactionEmojis,
  DiscordSkuIds,
  EmbedColors,
  UserSettingsResponseDisplayTypes,
} from '../../../constants';
import { DefaultParameters, jobReply, jobWaitForResponse, linkPremiumSkuName, mediaReply } from '../../../utils';
import {
  DisplayPayload,
  MediaReplyEmbedFooter,
  createMediaReplyPage,
  displayReply,
  getMediaReplyActionsTimeout,
  getResponseDisplayForReply,
  renderEphemeralDisplay,
} from '../../../utils/tools';
import { getAutoEmbedLink } from '../../autoembed';
import { Page, Paginator } from '../../paginator';
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
  try {
    return await createMediaMessage(context, args, options, autoEmbed);
  } catch(error) {
    // a post with no images or videos (a text tweet, a reddit self post), `.embed` and auto-embed show its text by
    // itself. `.download` keeps saying there's no media
    if (options.post || autoEmbed) {
      const textOnly = await getTextOnlyPost(error);
      if (textOnly) {
        if (autoEmbed && !isAutoEmbedTextOn(context as Command.Context)) {
          // the server only wants media: a post that's just text is left to the link's own embed, no reply and no
          // reaction. one that linked to media we couldn't get still reacts as failed (`onRunError`)
          if (textOnly.mediaFailed) {
            throw error;
          }
          return;
        }
        return postTextReply(context, textOnly, (autoEmbed) ? autoEmbed.spoiler : !!args.spoiler);
      }
    }
    throw error;
  }
}


async function createMediaMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  options: CreateMessageOptions,
  autoEmbed: ReturnType<typeof getAutoEmbedLink>,
) {
  const fetchOptions = {
    downloadQuality: args.quality,
    locale: args.locale,
    mediaFormat: args.mediaFormat,
    safe: DefaultParameters.safe(context),
    url: args.url,
  };
  const job = await utilitiesFetchMedia(context, {...fetchOptions, mediaPosition: args.mediaPosition});
  // another page of the post (`response.pages`) is the same download at its position
  const fetchPage = async (position: number) => {
    return jobWaitForResponse(context, await utilitiesFetchMedia(context, {...fetchOptions, mediaPosition: position}));
  };
  if (autoEmbed) {
    return autoEmbedReply(context as Command.Context, job, autoEmbed.spoiler, fetchPage);
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
  const describe = (response: RestResponsesRaw.FileResponse) => {
    const lines = [
      (options.post && response.post) ? formatPost(translator, response.post, {spoiler: !!args.spoiler}).above : undefined,
      describeQuality(response),
    ].filter(Boolean);
    return (lines.length) ? lines.join('\n') : undefined;
  };
  const describeBelow = (response: RestResponsesRaw.FileResponse) => {
    return (options.post && response.post) ? formatPost(translator, response.post, {spoiler: !!args.spoiler}).below : undefined;
  };
  const describeEmbedFooter = (response: RestResponsesRaw.FileResponse) => {
    return (options.post && response.post) ? formatPost(translator, response.post, {spoiler: !!args.spoiler}).footer : undefined;
  };
  // the same text on every page, with which page it is under the media when it's one of a gallery's
  const replyOptions = (response: RestResponsesRaw.FileResponse, pageText?: PageText) => ({
    description: describe(response),
    descriptionBelow: withPageText(describeBelow(response), pageText),
    embedFooter: withPageFooter(describeEmbedFooter(response), pageText),
    spoiler: args.spoiler,
  });
  return jobReply(context, job, {
    send: (response) => {
      if (hasPages(response)) {
        return replyWithPages(context, translator, response, fetchPage, (page, pageText) => {
          return createMediaReplyPage(context, page, replyOptions(page, pageText));
        });
      }
      return mediaReply(context, response, replyOptions(response));
    },
    // `.embed` replaces the link's preview like auto-embed does (slash commands have no message of theirs to change)
    onSuccess: (options.post && context instanceof Command.Context) ? () => suppressLinkEmbed(context) : undefined,
  });
}


// how long a post's page buttons keep working, a slash reply's go sooner (`getMediaReplyActionsTimeout`)
const PAGES_TIMEOUT = 10 * 60 * 1000;

// which page of a gallery it is, under the media like the post's site and stats (`below`), the embed display has it
// in its footer
interface PageText {
  below: string,
  footer: string,
}

function hasPages(response: RestResponsesRaw.FileResponse): boolean {
  return !!response.pages && 1 < response.pages.count;
}

function withPageText(below: string | undefined, pageText?: PageText): string | undefined {
  if (!pageText) {
    return below;
  }
  // the post's `-# site • time • stats` line gets it last, otherwise it's its own small line
  return (below) ? `${below} • ${pageText.footer}` : pageText.below;
}

function withPageFooter(footer: MediaReplyEmbedFooter | undefined, pageText?: PageText): MediaReplyEmbedFooter | undefined {
  if (!pageText || !footer) {
    // without a footer the embed shows `descriptionBelow`, which has it
    return footer;
  }
  return {...footer, text: [footer.text, pageText.footer].filter(Boolean).join(' • ')};
}

// a post with more than one media (`response.pages`, a gallery or carousel) is a paginator, starting on the page that
// was asked for (`-position 1` is page 2). a page is that position of the same link, downloaded the first time it's
// shown and kept for paging back. a page that fails tells whoever pressed it why and the last one stays up
function replyWithPages(
  context: Command.Context | Interaction.InteractionContext,
  translator: Translator,
  response: RestResponsesRaw.FileResponse,
  fetchPage: (position: number) => Promise<RestResponsesRaw.FileResponse>,
  createPage: (response: RestResponsesRaw.FileResponse, pageText: PageText) => Promise<Page>,
  options: {deleteContextMessage?: boolean} = {},
) {
  const { language, translate } = translator;
  const pages = response.pages!;
  // failed downloads aren't kept so they can be tried again
  const cache = new Map<number, Promise<RestResponsesRaw.FileResponse>>([[pages.position, Promise.resolve(response)]]);
  const fetchCached = (position: number) => {
    let promise = cache.get(position);
    if (!promise) {
      // no "took", it would count from when the command was run
      promise = fetchPage(position).then((page) => ({...page, took: 0}));
      promise.catch(() => cache.delete(position));
      cache.set(position, promise);
    }
    return promise;
  };
  const paginator = new Paginator(context, {
    deleteContextMessage: options.deleteContextMessage,
    expire: getMediaReplyActionsTimeout(context, PAGES_TIMEOUT),
    page: pages.position + 1,
    pageLimit: pages.count,
    onError: (error, paginator, ctx) => (ctx) ? replyPageError(ctx, context, translator, error) : undefined,
    onPage: async (pageNumber) => {
      const page = await fetchCached(pageNumber - 1);
      const text = translate('paginator.page', {
        page: pageNumber.toLocaleString(language),
        total: paginator.pageLimit.toLocaleString(language),
      });
      return createPage(page, {below: `-# ${text}`, footer: text});
    },
  });
  return paginator.start();
}


// why a page couldn't be shown, only to whoever pressed it (the reply keeps the last page)
async function replyPageError(
  ctx: ComponentContext | InteractionModalContext,
  context: Command.Context | Interaction.InteractionContext,
  translator: Translator,
  error: any,
): Promise<void> {
  // required here, commands/errors imports utils (and this file with it) back
  const { createRunErrorPayload, warning }: typeof import('../../../commands/errors') = require('../../../commands/errors');
  try {
    const payload = await createRunErrorPayload(context, warning(translator.translate('errors.prefix_run_title')), error, translator);
    // the upsell like `replyError` has it
    const { upsell } = payload;
    let description = payload.description;
    if (upsell) {
      description = (upsell.text) ?
        `${description}\n-# ${linkPremiumSkuName(context, upsell.text, upsell.skuId)}` :
        linkPremiumSkuName(context, description, upsell.skuId);
    }
    await ctx.createMessage(renderEphemeralDisplay(ctx, translator, {color: EmbedColors.ERROR, description, title: payload.title}));
  } catch(error) {

  }
}


// auto-embed: no thinking reply while it downloads (the typing indicator shows it's on it) and no upsell line, just the
// media, with the post's text above it when the server wants that. a failed job throws for `onRunError` to react with,
// then the link's own embed goes away since ours replaced it
async function autoEmbedReply(
  context: Command.Context,
  job: Parameters<typeof jobWaitForResponse>[1],
  spoiler: boolean,
  fetchPage: (position: number) => Promise<RestResponsesRaw.FileResponse>,
) {
  const response = await jobWaitForResponse(context, job);
  const translator = await getTranslator(context);
  const replyOptions = (page: RestResponsesRaw.FileResponse, pageText?: PageText) => {
    const post: FormattedPost = (isAutoEmbedTextOn(context) && page.post) ? formatPost(translator, page.post, {spoiler}) : {};
    return {
      description: post.above,
      descriptionBelow: withPageText(post.below, pageText),
      embedFooter: withPageFooter(post.footer, pageText),
      hideDetails: true,
      spoiler,
    };
  };
  // a gallery's other pages are shown the same way. stop never deletes their post, it isn't a command
  const reply = (hasPages(response)) ?
    await replyWithPages(context, translator, response, fetchPage, (page, pageText) => {
      return createMediaReplyPage(context, page, replyOptions(page, pageText));
    }, {deleteContextMessage: false}) :
    await mediaReply(context, response, replyOptions(response));
  await suppressLinkEmbed(context);
  return reply;
}


// the server's auto-embed text setting (post text and author with the media)
function isAutoEmbedTextOn(context: Command.Context): boolean {
  const settings = (context.guildId) ? GuildSettingsStore.get(context.guildId) : null;
  return !!(settings && settings.settings && settings.settings.autoEmbedText);
}


interface TextOnlyPost {
  // it linked to media that couldn't be downloaded (a link card's video), not just a post with only text
  mediaFailed: boolean,
  post: RestResponsesRaw.FetchMediaPost,
}

// the api's no-media error has the post's text when the site's downloader found the post (`DownloadErrorNoMedia`)
async function getTextOnlyPost(error: any): Promise<TextOnlyPost | null> {
  const apiError = (error instanceof JobError) ? error.apiError : await getApiError(error);
  if (!apiError || apiError.code !== ApiErrorCodes.MEDIA_NOT_FOUND_IN_URL) {
    return null;
  }
  const post = apiError.post;
  if (!post || typeof(post) !== 'object') {
    return null;
  }
  return {mediaFailed: apiError.media_failed === true, post: post as RestResponsesRaw.FetchMediaPost};
}


// a text post laid out like one with media, just without it: who and what above, where/when/counts under (the embed
// display has those in its footer like `mediaReply`), and where the media would be a line saying it couldn't be had
// when it linked to some. auto-embed only shows it when the server has the text on
async function postTextReply(
  context: Command.Context | Interaction.InteractionContext,
  { mediaFailed, post }: TextOnlyPost,
  spoiler: boolean,
) {
  const translator = await getTranslator(context);
  const formatted = formatPost(translator, post, {spoiler});
  const notice = (mediaFailed) ? `-# ${translator.translate('tools_embed.media_failed')}` : undefined;
  const display = await getResponseDisplayForReply(context);
  const payload: DisplayPayload = (display === UserSettingsResponseDisplayTypes.LEGACY && formatted.footer) ? {
    description: [formatted.above, notice].filter(Boolean).join('\n'),
    footer: formatted.footer.text,
    footerIconUrl: formatted.footer.iconUrl,
    timestamp: formatted.footer.timestamp,
  } : {
    description: [formatted.above, notice, formatted.below].filter(Boolean).join('\n'),
  };
  const reply = await displayReply(context, payload);
  if (context instanceof Command.Context) {
    await suppressLinkEmbed(context);
  }
  return reply;
}


// the counts in the order they're shown, what people react with first and how far it went last
const POST_STATS: Array<RestResponsesRaw.FetchMediaPostStat> = ['likes', 'upvotes', 'notes', 'saves', 'reposts', 'comments', 'views'];

// a post's text isn't ours, keep it from restyling the reply (`# heading`, `-# subtext`, lists), one line at a time
// since the escapes join lines. it can't ping anyone, replies don't allow mentions
// a quoted post's text is context for the media, kept short under the post's own
const MAX_QUOTED_POST_TEXT = 300;

function quotePostText(text: string, spoiler: boolean): string {
  return text.split('\n').map((line) => {
    line = (line.trim()) ? Markup.escape.subtext(Markup.escape.header(Markup.escape.list(line.trimEnd()))) : '';
    return (line && spoiler) ? `> ||${line}||` : `> ${line}`;
  }).join('\n');
}

// the provider a post's link is on, for its icon (`DiscordEmojis.POST_SITES`). by the link and not `site`, reddit's site
// is the subreddit
const POST_PROVIDER_HOSTS: Array<[string, string]> = [
  ['bsky.app', 'bluesky'],
  ['facebook.com', 'facebook'],
  ['fb.watch', 'facebook'],
  ['instagram.com', 'instagram'],
  ['pin.it', 'pinterest'],
  ['redd.it', 'reddit'],
  ['reddit.com', 'reddit'],
  ['streamable.com', 'streamable'],
  ['threads.com', 'threads'],
  ['threads.net', 'threads'],
  ['tiktok.com', 'tiktok'],
  ['tumblr.com', 'tumblr'],
  ['twitter.com', 'x'],
  ['x.com', 'x'],
  ['youtu.be', 'youtube'],
  ['youtube.com', 'youtube'],
];

function getPostSiteEmoji(post: RestResponsesRaw.FetchMediaPost): string {
  let hostname = '';
  try {
    hostname = new URL(post.url || '').hostname.toLowerCase();
  } catch(error) {
    return '';
  }
  // pinterest has a domain per country
  if (/(?:^|\.)pinterest\.[a-z.]+$/.test(hostname)) {
    return DiscordEmojis.POST_SITES.pinterest || '';
  }
  const match = POST_PROVIDER_HOSTS.find(([host]) => hostname === host || hostname.endsWith(`.${host}`));
  return (match) ? (DiscordEmojis.POST_SITES[match[1]] || '') : '';
}

// the site emoji's picture, for an embed footer's icon (footers can't show emojis)
function getPostSiteIconUrl(post: RestResponsesRaw.FetchMediaPost): string | undefined {
  const match = getPostSiteEmoji(post).match(/^<(a)?:\w+:(\d+)>$/);
  if (!match) {
    return undefined;
  }
  return DiscordEndpoints.CDN.URL + DiscordEndpoints.CDN.EMOJI(match[2], (match[1]) ? 'gif' : 'png');
}

export interface FormattedPost {
  // above the media: what it is and who posted it, then its text
  above?: string,
  // under the media: where it's from, when, and its counts
  below?: string,
  // `below` for the embed display: its footer (no links or markdown there) with discord's own time after it
  footer?: MediaReplyEmbedFooter,
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
  // the media is the quoted post's, whose it is goes right above it:
  // -# Quoting [Name (@handle)](<quoted post>)
  // > its text
  const quoted = post.quoted;
  if (quoted) {
    const quotedName = (quoted.author_name) ? Markup.escape.all(quoted.author_name) : null;
    const quotedHandle = (quoted.author_username) ? Markup.escape.all(`@${quoted.author_username}`) : null;
    const who = (quotedName && quotedHandle) ? `${quotedName} (${quotedHandle})` : (quotedName || quotedHandle);
    if (who) {
      above.push(`-# ${translate('tools_download.quoting', {name: (quoted.url) ? Markup.url(who, `<${quoted.url}>`) : who})}`);
    }
    if (quoted.text) {
      // by code point, an emoji cut in half would show as garbage
      const characters = Array.from(quoted.text);
      const text = (MAX_QUOTED_POST_TEXT < characters.length) ? `${characters.slice(0, MAX_QUOTED_POST_TEXT - 1).join('').trimEnd()}…` : quoted.text;
      above.push(quotePostText(text, !!options.spoiler));
    }
  }

  const below: Array<string> = [];
  if (post.site) {
    const site = Markup.escape.all(post.site);
    const emoji = getPostSiteEmoji(post);
    const text = (post.url) ? Markup.url(site, `<${post.url}>`) : site;
    below.push((emoji) ? `${emoji} ${text}` : text);
  }
  if (post.timestamp) {
    below.push(Markup.timestamp(post.timestamp * 1000, MarkupTimestampStyles.RELATIVE));
  }
  const stats = formatPostStats(language, translate, post.stats);
  below.push(...stats);

  // like discord's own link previews: `[icon] X • 5.3K likes • 90 comments • Today at 5:55 AM`
  const footerText = [post.site, ...stats].filter(Boolean).join(' • ');
  const footer: MediaReplyEmbedFooter = {
    iconUrl: (footerText) ? getPostSiteIconUrl(post) : undefined,
    text: footerText || undefined,
    timestamp: (post.timestamp) ? post.timestamp * 1000 : undefined,
  };

  return {
    above: (above.length) ? above.join('\n') : undefined,
    below: (below.length) ? `-# ${below.join(' • ')}` : undefined,
    footer: (footer.text || footer.timestamp) ? footer : undefined,
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
