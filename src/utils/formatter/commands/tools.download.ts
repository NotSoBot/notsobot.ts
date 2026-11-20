import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MarkupTimestampStyles, MessageFlags, Permissions } from 'detritus-client/lib/constants';
import { ComponentButton, ComponentContext, Components, InteractionModalContext, Markup } from 'detritus-client/lib/utils';
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
  MessageComponentCustomIds,
  PostGalleryViews,
  PostGalleryViewsToTypes,
  UserSettingsResponseDisplayTypes,
} from '../../../constants';
import { DefaultParameters, jobReply, jobWaitForResponse, linkPremiumSkuName, mediaReply } from '../../../utils';
import {
  DisplayPayload,
  MEDIA_REPLY_FILES_MAX,
  MediaReplyEmbedFooter,
  createMediaReplyFilesPage,
  createMediaReplyPage,
  displayReply,
  getMediaReplyActionsTimeout,
  getPostGallery,
  getResponseDisplayForReply,
  renderEphemeralDisplay,
} from '../../../utils/tools';
import { getAutoEmbedLink } from '../../autoembed';
import { Page, Paginator } from '../../paginator';
import { Translator, getCachedTranslator, getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.download';


export interface CommandArgs {
  locale?: string,
  mediaFormat?: string,
  mediaPosition?: number,
  quality?: string,
  spoiler?: boolean,
  url: string,
  // a post with more than one media as one gallery or one per page (`PostGalleryViews`), over their settings
  view?: string,
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
        return postTextReply(context, textOnly, (autoEmbed) ? autoEmbed.spoiler : !!args.spoiler, !!autoEmbed);
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
  // a post with more than one media shown as one gallery: the first request brings the whole ten holding the asked page
  // with it (one job on the api, not one for each). their setting or `-view pages` asks for that one page only
  const view = (args.view) ? PostGalleryViewsToTypes[args.view as PostGalleryViews] : undefined;
  const gallery = await getPostGallery(context, (autoEmbed) ? {autoEmbed: true} : {view});
  const job = await utilitiesFetchMedia(context, {
    ...fetchOptions,
    mediaGallerySize: (gallery) ? getGallerySize() : undefined,
    mediaPosition: args.mediaPosition,
  });
  // another page of the post (`response.pages`) is the same download at its position, another ten is one request too
  const fetchers: PageFetchers = {
    gallery: async (start: number) => {
      return jobWaitForResponse(context, await utilitiesFetchMedia(context, {...fetchOptions, mediaGallerySize: getGallerySize(), mediaPosition: start}));
    },
    page: async (position: number) => {
      return jobWaitForResponse(context, await utilitiesFetchMedia(context, {...fetchOptions, mediaPosition: position}));
    },
  };
  if (autoEmbed) {
    return autoEmbedReply(context as Command.Context, job, autoEmbed.spoiler, fetchers, gallery);
  }

  const translator = await getTranslator(context);
  const { translate } = translator;
  // the api only says when the cap picked the quality, so they don't have the tier that gets `best` (1440p is plus)
  const describeQuality = (response: RestResponsesRaw.FileResponse): string | undefined => {
    const quality = response.items[0].download_quality;
    if (!quality) {
      return undefined;
    }
    const { best, capped, tier } = quality;
    if (tier === 'premium_plus') {
      const text = translate('tools_download.quality_upsell_plus', {best, quality: capped});
      return `-# ${linkPremiumSkuName(context, text, DiscordSkuIds.USER_NOTSOPREMIUM_PLUS)}`;
    }
    const text = translate('tools_download.quality_upsell', {best, quality: capped});
    return `-# ${linkPremiumSkuName(context, text, DiscordSkuIds.USER_NOTSOPREMIUM)}`;
  };
  const describe = (response: RestResponsesRaw.FileResponse) => {
    const lines = [
      (options.post && response.items[0].post) ? formatPost(translator, response.items[0].post, {spoiler: !!args.spoiler}).above : undefined,
      describeQuality(response),
    ].filter(Boolean);
    return (lines.length) ? lines.join('\n') : undefined;
  };
  const describeBelow = (response: RestResponsesRaw.FileResponse) => {
    return (options.post && response.items[0].post) ? formatPost(translator, response.items[0].post, {spoiler: !!args.spoiler}).below : undefined;
  };
  const describeEmbedFooter = (response: RestResponsesRaw.FileResponse) => {
    return (options.post && response.items[0].post) ? formatPost(translator, response.items[0].post, {spoiler: !!args.spoiler}).footer : undefined;
  };
  // the same text on every page, which page it is replaces the size line when it's one of a post's. `.embed` has no
  // size line at all (it's the post, like auto-embed), only the page
  const replyOptions = (response: RestResponsesRaw.FileResponse, pageText?: string) => ({
    description: describe(response),
    descriptionBelow: describeBelow(response),
    details: pageText,
    embedFooter: describeEmbedFooter(response),
    hideDetails: !!options.post,
    spoiler: args.spoiler,
  });
  // a post's ten: the post's text from the first, the quality upsell from any that has one
  const galleryOptions = (page: GalleryPage, pageText?: string) => {
    const [ first ] = page.responses;
    const quality = page.responses.find((response) => response.items[0].download_quality) || first;
    return {
      ...replyOptions(first, pageText),
      description: joinLines(describe(quality), galleryNotice(translator, page)),
      // a paginator's page would bring the hosted ones back when paged to again
      reupload: !pageText,
      took: galleryTook(page),
    };
  };
  return jobReply(context, job, {
    send: async (response) => {
      if (hasPages(response)) {
        return replyWithPages(context, translator, response, fetchers, {
          gallery: (page, pageText) => createMediaReplyFilesPage(context, galleryEntries(page), galleryOptions(page, pageText)),
          single: (page, pageText) => createMediaReplyPage(context, page, replyOptions(page, pageText)),
        }, {gallery});
      }
      return mediaReply(context, response, replyOptions(response));
    },
    // `.embed` replaces the link's preview like auto-embed does (slash commands have no message of theirs to change)
    onSuccess: (options.post && context instanceof Command.Context) ? () => suppressLinkEmbed(context) : undefined,
  });
}


// how long a post's page buttons keep working, a slash reply's go sooner (`getMediaReplyActionsTimeout`)
const PAGES_TIMEOUT = 10 * 60 * 1000;

function hasPages(response: RestResponsesRaw.FileResponse): boolean {
  return !!response.pages && 1 < response.pages.count;
}

// a post with more than one media (`response.pages`, a gallery or carousel) is shown up to ten at a time, in one media
// gallery (discord's upload limit is per file, so every one the api attached fits). more than ten is a paginator of
// tens, starting on the ten with the asked for page (`-position 12` starts on 11-20). each media is that position of
// the same link, a ten is one request (`media_gallery_size`, the command's own brings the first) and kept for paging
// back. ones that fail are left out with a note (and tried again, one by one, when their ten comes back). a first ten
// that can't be one gallery (audio, or only one of them came through) pages one media at a time instead, starting on
// the page that was asked for. a call, not a constant: utils/tools imports this file back (through utils/index and the
// listeners), so at load time its `MEDIA_REPLY_FILES_MAX` is still undefined and a copy of it here stayed undefined
// (no gallery size was sent and every ten came out empty, "None of this part of the post could be downloaded")
function getGallerySize(): number {
  return MEDIA_REPLY_FILES_MAX;
}

// how a post's other pages are downloaded
interface PageFetchers {
  // the ten starting at `start` in one request, as `items` (each with its `position`) with `gallery`
  gallery: (start: number) => Promise<RestResponsesRaw.FileResponse>,
  // one media, at its position
  page: (position: number) => Promise<RestResponsesRaw.FileResponse>,
}

// a post's media in a response by their `position` (one, or a gallery request's ten), each as its own response
function galleryResponses(response: RestResponsesRaw.FileResponse): Array<[number, RestResponsesRaw.FileResponse]> {
  const entries: Array<[number, RestResponsesRaw.FileResponse]> = [];
  for (const item of response.items) {
    if (typeof(item.position) === 'number') {
      entries.push([item.position, {...response, items: [item]}]);
    }
  }
  return entries;
}

export interface GalleryPage {
  // how many of its positions couldn't be downloaded
  failed: number,
  responses: Array<RestResponsesRaw.FileResponse>,
}

interface PageRenderers {
  // one media of a post the gallery can't show
  single: (response: RestResponsesRaw.FileResponse, pageText: string) => Promise<Page>,
  // up to ten of them, `pageText` only when there's more than one ten. which page it is replaces the size line
  gallery: (gallery: GalleryPage, pageText?: string) => Promise<Page>,
}

// what a media gallery item can show: a picture, or a video that has one (one without is only audio)
function isGalleryMedia(response: RestResponsesRaw.FileResponse): boolean {
  const { metadata } = response.items[0].file;
  const mimetype = metadata.mimetype || '';
  return (mimetype.startsWith('image/') || mimetype.startsWith('video/')) && !!(metadata.width && metadata.height);
}

function galleryEntries(gallery: GalleryPage): Array<RestResponsesRaw.FileResponseItem> {
  return gallery.responses.map((response) => response.items[0]);
}

// "took" is the command's, only on the ten it started with (the others' are zeroed by `replyWithPages`)
function galleryTook(gallery: GalleryPage): number {
  return Math.max(0, ...gallery.responses.map((response) => response.took || 0));
}

// above the media, after the post's text: how many of the ten couldn't be downloaded
function galleryNotice(translator: Translator, gallery: GalleryPage): string | undefined {
  if (!gallery.failed) {
    return undefined;
  }
  return `-# ${translator.translate('tools_embed.gallery_failed', {count: gallery.failed.toLocaleString(translator.language)})}`;
}

function joinLines(...lines: Array<string | undefined>): string | undefined {
  return lines.filter(Boolean).join('\n') || undefined;
}

function replyWithPages(
  context: Command.Context | Interaction.InteractionContext,
  translator: Translator,
  response: RestResponsesRaw.FileResponse,
  fetchers: PageFetchers,
  render: PageRenderers,
  // false pages one media at a time right away (their setting or `-view pages`), without downloading ten at once
  options: {deleteContextMessage?: boolean, gallery?: boolean} = {},
) {
  const { language, translate } = translator;
  const pages = response.pages!;
  // the page that was asked for (the site's last when it was past the end)
  const askedPosition = response.items[0].position || 0;
  // what came through by position, failed ones aren't kept so they can be tried again
  const responses = new Map<number, RestResponsesRaw.FileResponse>(galleryResponses(response));
  const fetching = new Map<number, Promise<RestResponsesRaw.FileResponse>>();
  const fetchCached = (position: number): Promise<RestResponsesRaw.FileResponse> => {
    const page = responses.get(position);
    if (page) {
      return Promise.resolve(page);
    }
    let promise = fetching.get(position);
    if (!promise) {
      // no "took", it would count from when the command was run
      promise = fetchers.page(position).then((fetched) => {
        const page = {...fetched, took: 0};
        responses.set(position, page);
        return page;
      }).finally(() => fetching.delete(position));
      fetching.set(position, promise);
    }
    return promise;
  };
  // a ten's one request, pressing to it again while it runs waits on the same one
  const galleryFetching = new Map<number, Promise<void>>();
  const fetchGalleryRequest = (index: number): Promise<void> => {
    let promise = galleryFetching.get(index);
    if (!promise) {
      promise = fetchers.gallery(index * getGallerySize()).then((fetched) => {
        for (const [position, page] of galleryResponses({...fetched, took: 0})) {
          if (!responses.has(position)) {
            responses.set(position, page);
          }
        }
      }).finally(() => galleryFetching.delete(index));
      galleryFetching.set(index, promise);
    }
    return promise;
  };
  const galleryPositions = (index: number): Array<number> => {
    const start = index * getGallerySize();
    const end = Math.min(start + getGallerySize(), pages.count);
    return Array.from({length: end - start}, (_, i) => start + i);
  };
  // a ten (0 based) from what's already here, in order
  const collectGallery = (index: number, error?: any): GalleryPage => {
    const positions = galleryPositions(index);
    const collected = positions.map((position) => responses.get(position)).filter(Boolean) as Array<RestResponsesRaw.FileResponse>;
    if (!collected.length) {
      throw error || new Error('None of this part of the post could be downloaded');
    }
    return {failed: positions.length - collected.length, responses: collected};
  };
  // a ten (0 based), downloading what isn't here yet. only throws when none of them came through
  const fetchGallery = async (index: number): Promise<GalleryPage> => {
    const missing = galleryPositions(index).filter((position) => !responses.has(position));
    let error: any;
    if (missing.length && missing.length === galleryPositions(index).length) {
      // none of it yet, the whole ten in one request
      try {
        await fetchGalleryRequest(index);
      } catch(fetchError) {
        error = fetchError;
      }
    } else if (missing.length) {
      // the ones that failed before, one by one
      const results = await Promise.allSettled(missing.map(fetchCached));
      for (let result of results) {
        if (result.status === 'rejected' && error === undefined) {
          error = result.reason;
        }
      }
    }
    return collectGallery(index, error);
  };
  const createPageText = (pageNumber: number, pageLimit: number): string => {
    return translate('paginator.page', {
      page: pageNumber.toLocaleString(language),
      total: pageLimit.toLocaleString(language),
    });
  };
  const createPaginator = (page: number, pageLimit: number, onPage: (pageNumber: number) => Promise<Page>) => {
    return new Paginator(context, {
      deleteContextMessage: options.deleteContextMessage,
      expire: getMediaReplyActionsTimeout(context, PAGES_TIMEOUT),
      page,
      pageLimit,
      onError: (error, paginator, ctx) => (ctx) ? replyPageError(ctx, context, translator, error) : undefined,
      onPage,
    });
  };

  return (async () => {
    const firstIndex = Math.floor(askedPosition / getGallerySize());
    // the first ten came with the response (its failed ones aren't tried again right away)
    let first: GalleryPage | null = null;
    if (options.gallery !== false) {
      first = collectGallery(firstIndex);
    }
    if (first && 2 <= first.responses.length && first.responses.every(isGalleryMedia)) {
      const pageLimit = Math.ceil(pages.count / getGallerySize());
      const paginator = createPaginator(firstIndex + 1, pageLimit, async (pageNumber) => {
        // the first ten is already here, its failed ones aren't tried again right away
        let gallery: GalleryPage;
        if (first && pageNumber === firstIndex + 1) {
          gallery = first;
          first = null;
        } else {
          gallery = await fetchGallery(pageNumber - 1);
        }
        return render.gallery(gallery, (1 < pageLimit) ? createPageText(pageNumber, pageLimit) : undefined);
      });
      return paginator.start();
    }

    // one at a time, the ten's downloads stay in the cache for paging to them
    const paginator = createPaginator(askedPosition + 1, pages.count, async (pageNumber) => {
      const page = await fetchCached(pageNumber - 1);
      return render.single(page, createPageText(pageNumber, pages.count));
    });
    return paginator.start();
  })();
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
  fetchers: PageFetchers,
  gallery: boolean,
) {
  const response = await jobWaitForResponse(context, job);
  const translator = await getTranslator(context);
  const buttons = [createAutoEmbedUndoButton(context, translator)];
  // no size line, which page it is still shows in its place
  const replyOptions = (page: RestResponsesRaw.FileResponse, pageText?: string) => {
    const post: FormattedPost = (isAutoEmbedTextOn(context) && page.items[0].post) ? formatPost(translator, page.items[0].post, {spoiler}) : {};
    return {
      buttons,
      description: post.above,
      descriptionBelow: post.below,
      details: pageText,
      embedFooter: post.footer,
      hideDetails: true,
      spoiler,
    };
  };
  const galleryOptions = (page: GalleryPage, pageText?: string) => {
    const options = replyOptions(page.responses[0], pageText);
    return {...options, description: joinLines(options.description, galleryNotice(translator, page)), reupload: !pageText};
  };
  // a gallery's other tens (or pages) are shown the same way. stop never deletes their post, it isn't a command
  const reply = (hasPages(response)) ?
    await replyWithPages(context, translator, response, fetchers, {
      gallery: (page, pageText) => createMediaReplyFilesPage(context, galleryEntries(page), galleryOptions(page, pageText)),
      single: (page, pageText) => createMediaReplyPage(context, page, replyOptions(page, pageText)),
    }, {deleteContextMessage: false, gallery}) :
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
  autoEmbed: boolean = false,
) {
  const translator = await getTranslator(context);
  const formatted = formatPost(translator, post, {spoiler});
  const notice = (mediaFailed) ? `-# ${translator.translate('tools_embed.media_failed')}` : undefined;
  const display = await getResponseDisplayForReply(context);
  let components: Components | undefined;
  if (autoEmbed && context instanceof Command.Context) {
    components = new Components();
    components.addButton(createAutoEmbedUndoButton(context, translator));
  }
  const payload: DisplayPayload = (display === UserSettingsResponseDisplayTypes.LEGACY && formatted.footer) ? {
    description: [formatted.above, notice].filter(Boolean).join('\n'),
    footer: formatted.footer.text,
    footerIconUrl: formatted.footer.iconUrl,
    timestamp: formatted.footer.timestamp,
  } : {
    description: [formatted.above, notice, formatted.below].filter(Boolean).join('\n'),
  };
  if (components) {
    payload.components = components;
    payload.componentsInside = true;
  }
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


// auto-embed's Undo, on every auto-embed (each of a gallery's pages too). static so it still works after a restart:
// whose link it was and their message are in the custom id (`onAutoEmbedUndo`)
function createAutoEmbedUndoButton(context: Command.Context, translator: Translator): ComponentButton {
  return new ComponentButton({
    customId: [MessageComponentCustomIds.AUTO_EMBED_UNDO, context.userId, context.messageId].join('.'),
    label: translator.translate('tools_embed.undo'),
  });
}

// the Undo press: our reply goes and the link's own preview comes back on their message (`suppressLinkEmbed` in
// reverse). only whoever posted the link, or someone who could delete it anyway (manage messages there)
export async function onAutoEmbedUndo(context: ComponentContext, userId: string, messageId: string): Promise<void> {
  // cached only, the press has to be answered quickly
  const translator = getCachedTranslator(context);
  const canUndo = (
    context.userId === userId ||
    context.user.isClientOwner ||
    // an interaction's member has discord's permissions for the channel
    (!!context.member && context.member.can(Permissions.MANAGE_MESSAGES))
  );
  if (!canUndo) {
    await context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, renderEphemeralDisplay(context, translator, {
      color: EmbedColors.ERROR,
      description: translator.translate('tools_embed.undo_not_allowed'),
    }));
    return;
  }
  await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

  // their preview first, so it's back as ours goes. gone already (deleted, or nothing to undo) is fine
  try {
    const cached = context.messages.get(messageId);
    const flags: number = (cached) ? cached.flags : (await context.rest.fetchMessage(context.channelId, messageId)).flags;
    if ((flags & MessageFlags.SUPPRESS_EMBEDS) === MessageFlags.SUPPRESS_EMBEDS) {
      await context.rest.editMessage(context.channelId, messageId, {flags: flags & ~MessageFlags.SUPPRESS_EMBEDS});
    }
  } catch(error) {

  }

  const message = context.interaction.message;
  if (message && !message.deleted) {
    try {
      await context.rest.deleteMessage(context.channelId, message.id);
    } catch(error) {

    }
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
