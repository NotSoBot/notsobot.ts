import { Collections } from 'detritus-client';

import {
  GoogleCardTypes,
  GoogleImageVideoTypes,
  GoogleLocales,
  GuildLoggerTypes,
  ImageEyeTypes,
  ImageLegofyPalettes,
  RedditSortTypes,
  RedditTimeTypes,
  YoutubeResultTypes,
} from '../constants';

import { GoogleSearchImageResult } from './structures/googlesearchimageresult';
import {
  GuildSettings,
  GuildSettingsAllowlist,
  GuildSettingsBlocklist,
  GuildSettingsDisabledCommand,
  GuildSettingsLogger,
  GuildSettingsPrefix,
} from './structures/guildsettings';
import { User } from './structures/user';


export namespace RestOptions {
  export interface CreateGuildLogger {
    channelId: string,
    type: GuildLoggerTypes,
    webhookId: string,
    webhookToken: string,
  }

  export interface CreateUserCommand {
    channelId: string,
    content: string,
    contentUrl?: string,
    editedTimestamp?: null | number,
    failedReason?: string,
    guildId?: string,
    messageId: string,
    responseId?: string,
    responseUrl?: string,
  }

  export interface DeleteGuildLogger {
    channelId: string,
    type: GuildLoggerTypes,
  }

  export interface EditGuildSettings {
    allowlist?: Array<{
      id: string,
      type: string,
    }>,
    blocklist?: Array<{
      id: string,
      type: string,
    }>,
    prefixes?: Array<string>,
  }


  export interface FunASCII {
    text: string,
  }


  export interface GoogleContentVisionOCR {
    url: string,
  }

  export interface GoogleContentVisionWebDetection {
    url: string,
  }

  export interface GoogleTranslate {
    from?: GoogleLocales,
    text: string,
    to?: GoogleLocales,
  }

  export interface ImageBaseOptions {
    url: string,
  }

  export interface ImageDeepfry extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageExplode extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageEyes extends ImageBaseOptions {
    type?: ImageEyeTypes,
  }

  export interface ImageGlitch extends ImageBaseOptions {
    amount?: number,
    iterations?: number,
    seed?: number,
  }

  export interface ImageImplode extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageJPEG extends ImageBaseOptions {
    quality?: number,
  }

  export interface ImageLegofy extends ImageBaseOptions {
    dither?: boolean,
    palette?: ImageLegofyPalettes,
    size?: number,
  }

  export interface ImageMagik extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageMeme extends ImageBaseOptions {
    bottom?: string,
    top: string,
  }

  export interface ImagePixelate extends ImageBaseOptions {
    pixelWidth?: number,
  }

  export interface ImageSharpen extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageToolsResize extends ImageBaseOptions {
    convert?: string,
    scale?: number,
    size?: string,
  }

  export interface ImageToolsRotate extends ImageBaseOptions {
    degrees?: number,
  }


  export interface PutGuildSettings {
    icon: null | string,
    name: string,
  }

  export interface PutUser {
    avatar: null | string,
    bot: boolean,
    discriminator: string,
    username: string,
  }


  export interface SearchDuckDuckGo {
    query: string,
  }

  export interface SearchDuckDuckGoImages {
    query: string,
  }

  export interface SearchE621 {
    max_results?: number,
    query: string,
  }

  export interface SearchE926 {
    max_results?: number,
    query: string,
  }

  export interface SearchGoogle {
    locale?: GoogleLocales,
    maxResults?: number,
    query: string,
    safe?: boolean | string,
    showUnknown?: boolean | string,
  }

  export interface SearchGoogleImages {
    locale?: GoogleLocales,
    maxResults?: number,
    query: string,
    safe?: boolean | string,
  }

  export interface SearchGoogleReverseImages {
    url: string,
  }

  export interface SearchReddit {
    maxResults?: number,
    query: string,
    safe?: boolean | string,
    sort?: RedditSortTypes,
    subreddit?: string,
    time?: RedditTimeTypes,
  }

  export interface SearchRule34 {
    query: string,
  }

  export interface SearchRule34Paheal {
    query: string,
  }

  export interface SearchSteam {
    query: string,
    steamId?: string,
  }

  export interface SearchSteamProfile {
    query: string,
  }

  export interface SearchUrban {
    query: string,
  }

  export interface SearchUrbanRandom {

  }

  export interface SearchWikihow {
    query: string,
  }

  export interface SearchWikihowRandom {

  }

  export interface SearchWolframAlpha {
    query: string,
  }

  export interface SearchYoutube {
    query: string,
    sp?: string,
  }


  export interface UploadCommands {
    commands: Array<{
      aliases: Array<string>,
      args: Array<{aliases: Array<string>, name: string, prefix: string}>,
      description: string,
      dmable: boolean,
      examples: Array<string>,
      name: string,
      ratelimits: Array<{duration: number, limit: number, type: string}>,
      type: string,
      usage: string,
    }>,
  }
}


export namespace RestResponses {
  export type CreateGuildAllowlist = null;
  export type CreateGuildBlocklist = null;
  export type CreateGuildDisabledCommand = null;
  export type CreateGuildLogger = Collections.BaseCollection<string, GuildSettingsLogger>;
  export type CreateGuildPrefix = Collections.BaseCollection<string, GuildSettingsPrefix>;

  export type DeleteGuildAllowlist = null;
  export type DeleteGuildBlocklist = null;
  export type DeleteGuildDisabledCommand = null;
  export type DeleteGuildLogger = Collections.BaseCollection<string, GuildSettingsLogger>;
  export type DeleteGuildPrefix = Collections.BaseCollection<string, GuildSettingsPrefix>;

  export type EditGuildSettings = GuildSettings;

  export type FetchGuildSettings = GuildSettings;
  export type FetchUser = User;

  export type SearchGoogleImages = Array<GoogleSearchImageResult>;

  export type PutGuildSettings = GuildSettings;
  export type PutUser = User;
}


export namespace RestResponsesRaw {

  export type CreateGuildAllowlist = null;
  export type CreateGuildBlocklist = null;
  export type CreateGuildDisabledCommand = null;
  export type CreateGuildLogger = Array<GuildLogger>;
  export type CreateGuildPrefix = Array<GuildPrefix>;

  export interface CreateUserCommand {
    
  }

  export type DeleteGuildAllowlist = null;
  export type DeleteGuildBlocklist = null;
  export type DeleteGuildDisabledCommand = null;
  export type DeleteGuildLogger = Array<GuildLogger>;
  export type DeleteGuildPrefix = Array<GuildPrefix>;

  export type EditGuildSettings = GuildSettings;

  export type FetchGuildSettings = GuildSettings;
  export type FetchUser = User;

  export type PutUser = User;


  export interface FunAscii {
    image: {
      data: string,
      details: {
        extension: string,
        filename: string,
        height: number,
        mimetype: string,
        width: number,
      },
    },
    text: string,
  }


  export interface GoogleContentVisionOCR {
    annotation: null | {description: string, locale: GoogleLocales},
  }

  export interface GoogleContentVisionWebDetection {
    bestGuessLabels: Array<{label: string}>,
    fullMatchingImages?: Array<{url: string}>,
    pagesWithMatchingImages?: Array<{
      pageTitle: string,
      partialMatchingImages: Array<{url: string}>,
      url: string,
    }>,
    partialMatchingImages?: Array<{url: string}>,
    visuallySimilarImages?: Array<{url: string}>,
    webEntities: Array<{
      description: string,
      entityId: string,
      score: number,
    }>,
  }

  export interface GoogleTranslate {
    from_language: GoogleLocales,
    from_text: string,
    translated_language: GoogleLocales,
    translated_text: string,
  }

  export interface GuildSettings {
    allowlist: Array<GuildAllowlist>,
    blocklist: Array<GuildBlocklist>,
    disabled_commands: Array<GuildDisabledCommand>,
    icon: string | null,
    id: string,
    name: string,
    prefixes: Array<GuildPrefix>,
    premium_type: number,
  }

  export interface GuildAllowlist {
    added: string,
    id: string,
    type: string,
    user_id: string,
  }

  export interface GuildBlocklist {
    added: string,
    id: string,
    type: string,
    user_id: string,
  }

  export interface GuildDisabledCommand {
    added: string,
    command: string,
    id: string,
    type: string,
    user_id: string,
  }

  export interface GuildLogger {
    channel_id: string,
    guild_id: string,
    logger_type: number,
    webhook_id?: string,
    webhook_token?: string,
  }

  export interface GuildPrefix {
    added: string,
    guild_id: string,
    prefix: string,
    user_id: string,
  }


  export interface SearchGoogle {
    cards: Array<SearchGoogleCard>,
    results: Array<SearchGoogleResult>,
    suggestion: null | {text: string, url: string},
    total_result_count: number,
  }

  export interface SearchGoogleReverseImages {
    related_search: {
      results: Array<SearchGoogleResult>,
      text: string,
      url: string,
    },
    similar_images: {
      results: Array<{search_url: string, url: string}>,
      url: string,
    },
    similar_results: Array<SearchGoogleResult>,
    thumbnail: string,
    total_result_count: number,
    url: string,
  }

  export type SearchGoogleImages = Array<SearchGoogleImage>;

  export interface SearchGoogleCard {
    description: null | string,
    fields: Array<{description: string, title: string}>,
    footer: null | string,
    header: null | string,
    image: null | string,
    thumbnail: null | string,
    title: string,
    type: GoogleCardTypes,
  }

  export interface SearchGoogleImage {
    color: number,
    created: null | string,
    description: string,
    header: string,
    footer: string,
    id: string,
    image: {
      extension: null | string,
      height: number,
      proxy_url: string,
      trusted: boolean,
      url: string,
      width: number,
    },
    metadata: {
      license: null | {
        about: string,
        licensable: boolean,
        text: string,
        url: string,
      },
      product: null | {
        brand: null | string,
        currency: null | string,
        description: string,
        in_stock: null | boolean,
        price: null | number,
        stars: null | number,
        stars_amount: null | number,
        title: string,
      },
      recipe: null | {
        description: string,
        duration: null | string,
        ingredients: Array<string>,
        servings: null | string,
        stars: null | number,
        stars_amount: null | number,
        title: string,
      },
      video: null | {
        channel: null | string,
        description: string,
        duration: null | string,
        likes: null | number,
        title: string,
        type: GoogleImageVideoTypes,
        uploaded_at: null | number,
        views: null | number,
      },
    },
    thumbnail: {
      height: number,
      proxy_url: string,
      trusted: boolean,
      url: string,
      width: number,
    },
    url: string,
  }

  export interface SearchGoogleResult {
    description: string,
    cite: string,
    fields: Array<{name: string, url: string, value: string}>,
    footer: string,
    suggestions: Array<{text: string, url: string}>,
    thumbnail: {
      description: string,
      height: number,
      proxy_url: string | null,
      reference_url: string | null,
      url: string | null,
      width: number,
    } | null,
    title: string,
    url: string,
    urls: Array<{text: string, url: string}>,
  }

  export type SearchRule34 = Array<SearchRule34Result>;
  export interface SearchRule34Result {
    created_at: string,
    creator_id: string,
    file_url: string,
    has_comments: boolean,
    has_notes: boolean,
    id: string,
    is_video: boolean,
    rating: string,
    score: number,
    source: string | null,
    status: string,
    tags: Array<string>,
    thumbnail_url: string,
    url: string,
  }

  export type SearchRule34Paheal = Array<SearchRule34PahealResult>;
  export interface SearchRule34PahealResult {
    author: {
      id: string,
      url: string,
    } | null,
    created_at: string,
    file_name: string,
    file_url: string,
    id: string,
    is_video: boolean,
    rating: string,
    score: number,
    source: string | null,
    tags: Array<string>,
    thumbnail_url: string,
    url: string,
  }

  export interface SearchSteam {
    count: number,
    results: Array<SearchSteamResult>,
  }

  export interface SearchSteamResult {
    avatar_url: string,
    country: string | null,
    country_flag_url: string | null,
    custom_url: string | null,
    in_common: Array<string>,
    past_names: Array<string>,
    real_name: string | null,
    steam_id: string | null,
    steam_id_64: string | null,
    url: string,
    username: string,
  }

  export interface SearchSteamProfile {
    avatar: {
      full: string,
      icon: string,
      medium: string,
    },
    custom_url: string | null,
    groups: Array<{
      avatar: {
        full: string | null,
        icon: string | null,
        medium: string | null,
      },
      headline: string | null,
      id_64: string,
      is_primary: boolean,
      member_count: number,
      members_in_chat: number,
      members_in_game: number,
      members_online: number,
      name: string | null,
      summary: string,
      url: string | null,
    }>,
    id: string,
    id_64: string,
    in_game: {
      join_link: string | null,
      icon: string,
      logo: string,
      name: string,
      url: string,
    } | null,
    in_game_ip: string | null,
    is_limited_account: boolean,
    is_vac_banned: boolean,
    location: string | null,
    member_since: string,
    most_played_games: Array<{
      hours_played_last_2_weeks: number,
      hours_played: number,
      icon: string,
      logo: string,
      name: string,
      url: string,
    }>,
    past_names: Array<{name: string, timestamp: string}>,
    privacy: string,
    real_name: string | null,
    state: string,
    state_message: string,
    steam_rating: null,
    summary: string | null,
    trade_ban_state: string,
    username: string,
    visibility_state: number,
  }

  export interface SearchYoutube {
    _body: any,
    results: Array<YoutubeSearchResult>,
    suggestions: Array<string>,
    total_result_count: number,
  }

  export type SearchWikihow = Array<SearchWikihowResult>;
  export interface SearchWikihowResult {
    badge: null | string,
    id: number,
    id_vanity: string,
    thumbnail: null | string,
    title: string,
    updated: string,
    url: string,
    views: number,
  }

  export interface SearchWikihowRandom {
    author: null | {
      avatar: {
        height: number,
        url: string,
        width: number,
      },
      name: string,
      type: string,
    },
    contributor: null | {
      name: string,
      type: string,
    },
    created: string,
    description: string,
    image: null | {
      height: number,
      url: string,
      width: number,
    },
    methods: Array<{
      steps: Array<{
        image: string,
        text: string,
        url: string,
      }>,
      title: string,
    }>,
    rating: {
      best: number,
      count: number,
      value: number,
    },
    title: string,
    updated: null | string,
    url: string,
    video: null | {
      description: string,
      thumbnail: string,
      uploaded: string,
      url: string,
    },
  }

  export interface User {
    avatar: null | string,
    blocked: boolean,
    bot: boolean,
    discriminator: string,
    id: string,
    flags: number,
    username: string,
    premium_type: number,
  }


  export type YoutubeSearchResult =
    YoutubeSearchResultChannel |
    YoutubeSearchResultMovie |
    YoutubeSearchResultPlaylist |
    YoutubeSearchResultVideo;

  export interface YoutubeSearchResultBase {
    description: string,
    thumbnail: {
      height: number,
      url: string,
      width: number,
    },
    title: string,
    url: string,
  }

  export interface YoutubeSearchResultChannel extends YoutubeSearchResultBase {
    metadata: {
      badges: Array<string>,
      id: string,
      is_show: boolean,
      subscriber_count: number,
      url: string,
      vanity: null | string,
      video_count: number,
    },
    type: YoutubeResultTypes.CHANNEL,
  }

  export interface YoutubeSearchResultMovie extends YoutubeSearchResultBase {
    metadata: {
      channel: {
        badges: Array<string>,
        id: string,
        name: string,
        url: string,
        vanity: null | string,
      },
      duration: number,
      fields: Array<{name: string, value: string}>,
      genre: string,
      id: string,
      price: string,
    },
    type: YoutubeResultTypes.MOVIE,
  }

  export interface YoutubeSearchResultPlaylist extends YoutubeSearchResultBase {
    metadata: {
      channel: {
        badges: Array<string>,
        id: string,
        name: string,
        url: string,
        vanity: null | string,
      },
      id: string,
      updated: null | string,
      video_count: number,
      videos: Array<{
        duration: number,
        id: string,
        title: string,
        url: string,
      }>,
    },
    type: YoutubeResultTypes.PLAYLIST;
  }

  export interface YoutubeSearchResultVideo extends YoutubeSearchResultBase {
    metadata: {
      badges: Array<string>,
      channel: {
        badges: Array<string>,
        id: string,
        name: string,
        thumbnail: {
          height: number,
          url: string,
          width: number,
        } | null,
        url: string,
        vanity: null | string,
      },
      duration: number,
      id: string,
      published: string,
      streamed: boolean,
      view_count: number,
    },
    type: YoutubeResultTypes.VIDEO,
  }
}
