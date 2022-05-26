import { Collections } from 'detritus-client';

import {
  GoogleCardTypes,
  GoogleImageVideoTypes,
  GoogleLocales,
  GuildLoggerTypes,
  ImageEyeTypes,
  ImageLegofyPalettes,
  ImageMemeFonts,
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
import { User, UserFull } from './structures/user';


export namespace RestOptions {
  export interface AudioBaseOptions {
    url: string,
  }

  export interface AudioToolsConvertOptions extends AudioBaseOptions {
    to: string,
  }

  export interface CreateGuildLogger {
    channelId: string,
    type: GuildLoggerTypes,
    webhookId: string,
    webhookToken: string,
  }

  export interface CreateUserCommand {
    channelId: string,
    commandType?: number,
    editedTimestamp?: null | number,
    failedReason?: string,
    guildId?: string,
    messageId: string,
    responseId?: string,
  }

  export interface CreateReminder {
    channelId?: string,
    content: string,
    guildId?: string,
    isAllDay?: boolean,
    messageId?: null | string,
    timestampEnd?: number,
    timestampStart: number,
  }

  export interface CreateTagUse {
    timestamp: number,
    userId: string,
  }


  export interface DeleteChannel {
    guildId: string,
  }

  export interface DeleteGuildLogger {
    channelId: string,
    type: GuildLoggerTypes,
  }

  export interface DeleteTag {
    name: string,
    serverId?: string,
  }


  export interface EditGuildSettings {
    allowlist?: Array<{
      id: string,
      type: string,
    }>,
    blocked?: boolean,
    blocklist?: Array<{
      id: string,
      type: string,
    }>,
    disabledCommands?: Array<{
      command: string,
      id: string,
      type: string,
    }>,
    prefixes?: Array<string>,
    timezone?: string,
  }

  export interface EditUser {
    blocked?: boolean,
    channelId?: null | string,
    locale?: null | string,
    optOutContent?: boolean,
    timezone?: null | string,
  }


  export interface FetchReminders {
    after?: string,
    before?: string,
    guildId?: string,
    limit?: number,
    timestampMax?: number,
    timestampMin?: number,
  }

  export interface FetchTag {
    name: string,
    serverId?: string,
  }

  export interface FetchTagRandom {
    content?: string,
    name?: string,
    serverId?: string,
    userId?: string,
  }

  export interface FetchTagsServer {
    after?: string,
    before?: string,
    content?: string,
    limit?: number,
    name?: string,
    userId?: string,
  }

  export interface FetchUserTags {
    after?: string,
    before?: string,
    content?: string,
    limit?: number,
    name?: string,
  }


  export interface FunASCII {
    text: string,
  }

  export interface FunTextToSpeech {
    text: string,
    voice?: string,
  }


  export interface GoogleContentVisionBase {
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

  export interface ImageBackgroundRemoveOptions extends ImageBaseOptions {
    model?: string,
  }

  export interface ImageObjectRemoveOptions extends ImageBaseOptions {
    object?: string,
  }

  export interface ImageCreateRetrowave {
    background?: number,
    line1?: string,
    line2?: string,
    line3?: string,
    textStyle?: number,
  }

  export interface ImageCreateTombstone {
    line1?: string,
    line2?: string,
    line3?: string,
    line4?: string,
    line5?: string,
  }

  export interface ImageCreateWordcloud {
    words: Array<string>,
  }

  export interface ImageManipulationBlur extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageManipulationCircle extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageManipulationDeepfry extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageManipulationExplode extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageManipulationEyes extends ImageBaseOptions {
    type?: ImageEyeTypes,
  }

  export interface ImageManipulationGlitch extends ImageBaseOptions {
    amount?: number,
    iterations?: number,
    seed?: number,
  }

  export interface ImageManipulationImplode extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageManipulationJPEG extends ImageBaseOptions {
    quality?: number,
  }

  export interface ImageManipulationLegofy extends ImageBaseOptions {
    dither?: boolean,
    palette?: ImageLegofyPalettes,
    size?: number,
  }

  export interface ImageManipulationMagik extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageManipulationMeme extends ImageBaseOptions {
    bottom?: string,
    font?: ImageMemeFonts,
    top: string,
  }

  export interface ImageManipulationPix2Pix extends ImageBaseOptions {
    model: string,
  }

  export interface ImageManipulationPixelate extends ImageBaseOptions {
    pixelWidth?: number,
  }

  export interface ImageManipulationSharpen extends ImageBaseOptions {
    scale?: number,
  }

  export interface ImageToolsConvert extends ImageBaseOptions {
    size?: string,
    to: string,
  }

  export interface ImageToolsCrop extends ImageBaseOptions {
    size?: string,
  }

  export interface ImageToolsGifSpeed extends ImageBaseOptions {
    loop?: boolean,
    speed: number,
  }

  export interface ImageToolsResize extends ImageBaseOptions {
    convert?: string,
    scale?: number,
    size?: string,
  }

  export interface ImageToolsRotate extends ImageBaseOptions {
    crop?: boolean,
    degrees?: number,
  }


  export interface PutGuildSettings {
    icon: null | string,
    name: string,
  }

  export interface PutInfoDiscord {
    clusterId: number,
    ramUsage: number,
    shardCount: number,
    shardsPerCluster: number,
    shards: Array<{
      shardId: number,
      status: string,
  
      applications?: number,
      channels?: number,
      channelThreads?: number,
      emojis?: number,
      events?: number,
      guilds?: number,
      guildScheduledEvents?: number,
      members?: number,
      memberCount?: number,
      messages?: number,
      permissionOverwrites?: number,
      presences?: number,
      presenceActivities?: number,
      roles?: number,
      stageInstances?: number,
      typings?: number,
      users?: number,
      voiceStates?: number,
    }>,
  }

  export interface PutTag {
    content: string,
    name: string,
    serverId?: string,
  }

  export interface PutUser {
    avatar: null | string,
    bot: boolean,
    blocked?: boolean,
    channelId?: null | string,
    discriminator: string,
    locale?: null | string,
    timezone?: null | string,
    username: string,
  }


  export interface Search4Chan {
    board: string,
  }

  export interface Search4ChanRandom {
    nsfw: boolean,
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

  export interface SearchImgur {
    query: string,
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

  export interface SearchSteamEmojis {
    maxResults?: number,
    query: string,
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
      aliases?: Array<string>,
      args?: Array<{aliases: Array<string>, description?: string, name: string, prefix: string}>,
      category: string,
      description?: string,
      dmable?: boolean,
      examples?: Array<string>,
      id: string,
      name: string,
      ratelimits?: Array<{duration: number, key?: string, limit: number, type: string}>,
      type: number,
      usage: string,
    }>,
  }


  export interface UtilitiesCodeRun {
    code: string,
    input?: string,
    language: string,
  }

  export interface UtilitiesCodeRunRextester {
    code: string,
    input?: string,
    language: string,
  }

  export interface UtilitiesFetchData {
    maxFileSize?: number,
    url: string,
  }

  export interface UtilitiesFetchImage {
    maxFileSize?: number,
    url: string,
  }

  export interface UtilitiesFetchMedia {
    maxFileSize?: number,
    url: string,
  }

  export interface UtilitiesFetchText {
    maxFileSize?: number,
    url: string,
  }

  export interface UtilitiesImagescriptV1 {
    code: string,
  }

  export interface UtilitiesQrCreate {
    margin?: number,
    query: string,
    size?: number | string,
  }

  export interface UtilitiesQrScan {
    url: string,
  }

  export interface UtilitiesScreenshot {
    url: string,
  }


  export interface VideoBaseOptions {
    url: string,
  }

  export interface VideoToolsConvertOptions extends VideoBaseOptions {
    removeAudio?: boolean,
    to: string,
  }
}


export namespace RestResponses {
  export type CreateGuildAllowlist = null;
  export type CreateGuildBlocklist = null;
  export type CreateGuildDisabledCommand = null;
  export type CreateGuildLogger = Collections.BaseCollection<string, GuildSettingsLogger>;
  export type CreateGuildPrefix = Collections.BaseCollection<string, GuildSettingsPrefix>;

  export type DeleteChannel = null;
  export type DeleteGuildAllowlist = null;
  export type DeleteGuildBlocklist = null;
  export type DeleteGuildDisabledCommand = null;
  export type DeleteGuildLogger = Collections.BaseCollection<string, GuildSettingsLogger>;
  export type DeleteGuildPrefix = Collections.BaseCollection<string, GuildSettingsPrefix>;

  export type EditGuildSettings = GuildSettings;
  export type EditUser = UserFull;

  export type FetchGuildSettings = GuildSettings;
  export type FetchUser = UserFull;

  export type SearchGoogleImages = Array<GoogleSearchImageResult>;

  export type PutGuildSettings = GuildSettings;
  export type PutInfoDiscord = null;
  export type PutUser = UserFull;
}


export namespace RestResponsesRaw {
  export interface AudioToolsIdentifySong {
    album: {name: string},
    artists: Array<{
      langs?: Array<{name: string, code: string}>,
      name: string,
      roles?: Array<string>,
    }>,
    duration: number,
    exids: string | null,
    genres: Array<string>,
    ids: {acrid: string, isrc: string, upc: string},
    label: string,
    platforms: {
      apple_music: AudioToolsIdentifySongPlatform | null,
      deezer: AudioToolsIdentifySongPlatform | null,
      musicbrainz: AudioToolsIdentifySongPlatformPartial | null,
      spotify: AudioToolsIdentifySongPlatform | null,
      youtube: AudioToolsIdentifySongPlatformPartial | null,
      raw: any,
    },
    release_date: string,
    result_from: number,
    score: number,
    timestamp: number,
    title: string,
  }

  export interface AudioToolsIdentifySongPlatform {
    album: {
      cover_url: string | null,
      id: string,
      name: string,
    },
    artist: {
      cover_url?: string | null,
      id: string,
      name: string,
    },
    bpm: number,
    disc: number,
    duration: number,
    genres: Array<string>,
    id: string,
    isrc: string,
    metadata: {
      audio_locale?: string,
      audio_traits?: Array<string>,
      has_lyrics?: boolean,
      has_time_synced_lyrics?: boolean,
      is_mastered_for_itunes?: boolean,
    },
    preview_url: string | null,
    release_date: string | null,
    title: string,
    track: number,
    url: string,
  }

  export interface AudioToolsIdentifySongPlatformPartial {
    id: string,
    url: string,
  }

  export type AudioToolsIdentify = Array<AudioToolsIdentifySong>;

  export type CreateGuildAllowlist = null;
  export type CreateGuildBlocklist = null;
  export type CreateGuildDisabledCommand = null;
  export type CreateGuildLogger = Array<GuildLogger>;
  export type CreateGuildPrefix = Array<GuildPrefix>;

  export type CreateReminder = Reminder;
  export type CreateTagUse = null;

  export interface CreateUserCommand {
    
  }

  export type DeleteChannel = null;
  export type DeleteGuildAllowlist = null;
  export type DeleteGuildBlocklist = null;
  export type DeleteGuildDisabledCommand = null;
  export type DeleteGuildLogger = Array<GuildLogger>;
  export type DeleteGuildPrefix = Array<GuildPrefix>;

  export type DeleteReminder = null;

  export type DeleteTag = null;

  export type EditGuildSettings = GuildSettings;
  export type EditUser = User;

  export type FetchGuildSettings = GuildSettings;

  export interface FetchReminders {
    count: number,
    reminders: Array<Reminder>,
  };

  export type FetchTag = Tag;
  export type FetchTagRandom = Tag;

  export interface FetchTagsServer {
    count: number,
    tags: Array<Tag>,
  }

  export type FetchUser = User;

  export interface FetchUserTags {
    count: number,
    tags: Array<Tag>,
  }

  export type PutTag = Tag;
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


  export interface GoogleContentVisionLabels {
    label_annotations: Array<{
      description: string,
      mid: string,
      score: number,
      topicality: number,
    }>,
  }

  export interface GoogleContentVisionOCR {
    annotation: null | {description: string, locale: GoogleLocales},
  }

  export interface GoogleContentVisionSafeSearch {
    safe_search_annotation: {
      adult: string,
      spoof: string,
      medical: string,
      violence: string,
      racy: string,
    },
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


  export interface ImageInformationExif {
    exif: Array<{
      bytes: number,
      description: null | string,
      components: number,
      name: string,
      raw: string,
      type: string,
      value: string,
    }>,
    information: {
      bands: number,
      delay: number,
      format: string,
      frames: number,
      height: number,
      interpretation: string,
      loop: boolean,
      mimetype: string,
      size: number,
      width: number,
    },
    metadata: {
      bands: number,
      coding: string,
      filename: string,
      format: string,
      'gif-comment'?: string,
      interpretation: string,
      height: number,
      'vips-loader': string,
      width: number,
      xoffset: number,
      xres: number,
      yoffset: number,
      yres: number,
      [key: string]: any,
    },
    url: null | string,
  }


  export interface Search4ChanMedia {
    deleted: boolean,
    extension: string,
    height: number,
    md5: string,
    mobile_optimized: boolean,
    name: string,
    size: number,
    spoiler: boolean,
    spoiler_id: null | number,
    tag: null | string,
    url: string,
    width: number,
  }

  export interface Search4ChanThread {
    closed: boolean,
    comment: string,
    created_at: number,
    created_at_text: string,
    edited_at: null | number,
    id: number,
    images: number,
    limited: {
      bump: boolean,
      images: boolean,
    },
    media: Search4ChanMedia | null,
    omitted: {
      images: number,
      posts: number,
    },
    posts: Array<{
      comment: string,
      created_at: number,
      created_at_text: string,
      id: number,
      media: Search4ChanMedia,
      reply_id: null | number,
      url: string,
      user: Search4ChanUser,
    }>,
    replies: number,
    sticky: boolean,
    sticky_cap: number | null,
    tail_size: number | null,
    title: string,
    unique_ips: number | null,
    url: string,
    url_semantic: string | null,
    user: Search4ChanUser,
  }

  export interface Search4ChanUser {
    badge: null | string,
    country: null | {code: string, name: string},
    id: null | string,
    name: string,
    since4pass: null | number,
    trip: null | string,
  }

  export interface Search4Chan {
    board: string,
    nsfw: boolean,
    threads: Array<Search4ChanThread>,
    url: string,
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
    fields: Array<{name: string, value: string}>,
    footer: null | string,
    header: null | string,
    image: null | string,
    sections: Array<{
      description: string,
      fields: Array<{name: string, title?: string, value: null | string, values?: Array<string>}>,
      title: string,
    }>,
    thumbnail: null | string,
    title: string,
    type: GoogleCardTypes,
    url: null | string,
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

  export interface SearchImgurResult {
    dislikes: number,
    id: string,
    likes: number,
    points: number,
    thumbnail: string,
    type: string,
    url: string,
    views: number,
  }

  export type SearchImgur = Array<SearchImgurResult>;

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


  export interface SearchReddit {
    results: Array<SearchRedditResult>,
  }

  export interface SearchRedditResult {
    all_awards: Array<any>,
    allow_live_comments: boolean,
    approved_at_utc: number | null,
    approved_by: string | null,
    archived: boolean,
    author: string,
    author_flair_background_color: null | any,
    author_flair_css_class: string | null,
    author_flair_richtext: Array<any>,
    author_flair_template_id: string,
    author_flair_text: string,
    author_flair_text_color: string,
    author_flair_type: string,
    author_fullname: string,
    author_patreon_flair: boolean,
    author_premium: boolean,
    awarders: Array<any>,
    banned_at_utc: number | null,
    banned_by: string | null,
    can_gild: boolean,
    can_mod_post: boolean,
    category: null | any,
    clicked: boolean,
    content_categories: null | any,
    contest_mode: boolean,
    created: number,
    created_utc: number,
    discussion_type: null | any,
    distinguished: null | any,
    domain: string,
    downs: number,
    edited: boolean,
    gilded: number,
    gildings: {},
    hidden: boolean,
    hide_score: boolean,
    id: string,
    is_crosspostable: boolean,
    is_meta: boolean,
    is_original_content: boolean,
    is_reddit_media_domain: boolean,
    is_robot_indexable: boolean,
    is_self: boolean,
    is_video: boolean,
    likes: null | any,
    link_flair_background_color: string,
    link_flair_css_class: string,
    link_flair_richtext: Array<any>,
    link_flair_text: string,
    link_flair_text_color: string,
    link_flair_type: string,
    locked: boolean,
    media: any,
    media_embed: {},
    media_only: boolean,
    mod_note: null | any,
    mod_reason_by: null | any,
    mod_reason_title: null | any,
    mod_reports: Array<any>,
    name: string,
    no_follow: boolean,
    num_comments: number,
    num_crossposts: number,
    num_reports: null | any,
    over_18: boolean,
    parent_whitelist_status: string,
    permalink: string,
    pinned: boolean,
    post_hint: string,
    preview: {
      enabled: boolean,
      images: Array<{
        id: string,
        resolutions: Array<{
          height: number,
          url: string,
          width: number,
        }>,
        source: {
          height: number,
          url: string,
          width: number,
        },
        variants: {},
      }>,
    },
    pwls: number,
    quarantine: boolean,
    removal_reason: null | any,
    removed_by: null | any,
    removed_by_category: null | any,
    report_reasons: null | any,
    saved: boolean,
    score: number,
    secure_media: null | any,
    secure_media_embed: {},
    selftext: string,
    selftext_html: string | null,
    send_replies: boolean,
    spoiler: boolean,
    stickied: boolean,
    subreddit: string,
    subreddit_id: string,
    subreddit_name_prefixed: string,
    subreddit_subscribers: number,
    subreddit_type: string,
    suggested_sort: null | any,
    thumbnail: string,
    thumbnail_height: number,
    thumbnail_width: number,
    title: string,
    top_awarded_type: null | any,
    total_awards_received: number,
    treatment_tags: Array<any>,
    ups: number,
    upvote_ratio: number,
    url: string,
    url_overridden_by_dest: string,
    user_reports: Array<any>,
    view_count: null | any,
    visited: boolean,
    whitelist_status: string,
    wls: number,
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

  export interface SearchSteamEmoji {
    description: string,
    image: {
      data: string,
      details: {
        extension: string,
        filename: string,
        height: number,
        mimetype: string,
        width: number,
      },
      url: string,
    },
    name: string,
  }

  export interface SearchSteamEmojis {
    count: number,
    results: Array<{
      app: {
        id: number,
        icon: string,
        name: string,
      },
      icon: string,
      icon_hash: string,
      id: string,
      name: string,
      metadata: {
        background_color: string,
        class_id: string,
        commodity: boolean,
        instance_id: string,
        name_color: string,
        tradable: boolean,
        type: string,
      },
      sale_price_text: string,
      sell_listings: string,
      sell_price: string,
      sell_price_text: string,
      url: string,
    }>,
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
    url: string,
    username: string,
    visibility_state: number,
  }


  export type SearchUrbanDictionary = Array<SearchUrbanDictionaryResult>;
  export interface SearchUrbanDictionaryResult {
    author: string,
    current_vote: string,
    defid: number,
    definition: string,
    example: string,
    permalink: string,
    sound_urls: Array<string>,
    thumbs_down: number,
    thumbs_up: number,
    word: string,
    written_on: string,
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

  export interface SearchYoutube {
    _body: any,
    results: Array<SearchYoutubeResult>,
    suggestions: Array<string>,
    total_result_count: number,
  }

  export type SearchYoutubeResult =
    SearchYoutubeResultChannel |
    SearchYoutubeResultMovie |
    SearchYoutubeResultPlaylist |
    SearchYoutubeResultVideo;

  export interface SearchYoutubeResultBase {
    description: string,
    thumbnail: {
      height: number,
      url: string,
      width: number,
    },
    title: string,
    url: string,
  }

  export interface SearchYoutubeResultChannel extends SearchYoutubeResultBase {
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

  export interface SearchYoutubeResultMovie extends SearchYoutubeResultBase {
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

  export interface SearchYoutubeResultPlaylist extends SearchYoutubeResultBase {
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

  export interface SearchYoutubeResultVideo extends SearchYoutubeResultBase {
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

  export interface UtilitiesCodeRun {
    content: string,
    error: string,
    files: Array<string>,
    language: string,
    stats: {
      memory: string,
      time_compilation: number,
      time_cpu: number,
      time_running: number,
      time_service: number,
    },
    warnings: string | null,
  }

  export interface UtilitiesCodeRunRextester {
    content: string,
    error: string,
    files: Array<string>,
    stats: {
      memory: string,
      time_compilation: number,
      time_cpu: number,
      time_running: number,
      time_service: number,
    },
    warnings: string | null,
  }

  export interface UtilitiesQrScan {
    scanned: Array<{
      data: string,
      box: {
        points: Array<{x: number, y: number}>,
        rectangle: {height: number, left: number, top: number, width: number},
      },
      type: string,
    }>,
    url?: string,
  }


  export interface Reminder {
    channel_id: string | null,
    channel_id_backup: string | null,
    content: string,
    guild_id: string | null,
    id: string,
    is_all_day: boolean,
    message_id: string | null,
    timestamp_end: string | null,
    timestamp_start: string,
    user: User,
  }

  export interface Tag {
    content: string,
    created: string,
    edited: string | null,
    global: boolean,
    guild_id: string | null,
    id: string,
    name: string,
    nsfw: boolean,
    server_id: string | null,
    user: User,
    uses: number,
  }

  export interface User {
    avatar: null | string,
    blocked: boolean,
    bot: boolean,
    channel_id?: null | string,
    discriminator: string,
    flags: number,
    id: string,
    locale?: GoogleLocales | null,
    opted_out?: {
      content: null | string,
    },
    premium_type?: number,
    username: string,
  }
}
