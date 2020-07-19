import { Collections } from 'detritus-client';

import {
  GoogleCardTypes,
  GoogleImageVideoTypes,
  GoogleLocales,
} from '../constants';

import { GoogleSearchImageResult } from './structures/googlesearchimageresult';
import {
  GuildSettings,
  GuildSettingsAllowlist,
  GuildSettingsBlocklist,
  GuildSettingsDisabledCommand,
  GuildSettingsPrefix,
} from './structures/guildsettings';


export namespace RestOptions {
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


  export interface GoogleContentVisionOCR {
    url: string,
  }

  export interface GoogleSearch {
    locale?: GoogleLocales,
    maxResults?: number,
    query: string,
    safe?: boolean | string,
    showUnknown?: boolean | string,
  }

  export interface GoogleSearchImages {
    locale?: GoogleLocales,
    maxResults?: number,
    query: string,
    safe?: boolean | string,
  }

  export interface GoogleTranslate {
    from?: GoogleLocales,
    text: string,
    to?: GoogleLocales,
  }


  export interface ImageJPEG {
    quality?: number,
    url: string,
  }

  export interface ImageMagik {
    scale?: number,
    url: string,
  }

  export interface ImageMagikGif {
    url: string,
  }

  export interface ImageMirrorBottom {
    url: string,
  }

  export interface ImageMirrorLeft {
    url: string,
  }

  export interface ImageMirrorRight {
    url: string,
  }

  export interface ImageMirrorTop {
    url: string,
  }

  export interface ImageResize {
    convert?: string,
    scale?: number,
    size?: string,
    url: string,
  }

  export interface PutGuildSettings {
    icon: null | string,
    name: string,
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

  export interface SearchRule34 {
    query: string,
  }

  export interface SearchRule34Paheal {
    query: string,
  }

  export interface SearchUrban {
    query: string,
  }

  export interface SearchUrbanRandom {

  }

  export interface SearchWolframAlpha {
    query: string,
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


  export interface YoutubeSearch {
    query: string,
  }
  
}


export namespace RestResponses {
  export type CreateGuildAllowlist = null;
  export type CreateGuildBlocklist = null;
  export type CreateGuildDisabledCommand = null;
  export type CreateGuildPrefix = Collections.BaseCollection<string, GuildSettingsPrefix>;

  export type DeleteGuildAllowlist = null;
  export type DeleteGuildBlocklist = null;
  export type DeleteGuildDisabledCommand = null;
  export type DeleteGuildPrefix = Collections.BaseCollection<string, GuildSettingsPrefix>;

  export type EditGuildSettings = GuildSettings;

  export type FetchGuildSettings = GuildSettings;

  export type GoogleSearchImages = Array<GoogleSearchImageResult>;

  export type PutGuildSettings = GuildSettings;
}


export namespace RestResponsesRaw {

  export type CreateGuildAllowlist = null;
  export type CreateGuildBlocklist = null;
  export type CreateGuildDisabledCommand = null;
  export type CreateGuildPrefix = Array<GuildPrefix>;

  export type DeleteGuildAllowlist = null;
  export type DeleteGuildBlocklist = null;
  export type DeleteGuildDisabledCommand = null;
  export type DeleteGuildPrefix = Array<GuildPrefix>;

  export type EditGuildSettings = GuildSettings;

  export type FetchGuildSettings = GuildSettings;

  export interface GoogleContentVisionOCR {
    annotation: null | {description: string, locale: GoogleLocales},
  }

  export interface GoogleSearch {
    cards: Array<GoogleSearchCard>,
    results: Array<GoogleSearchResult>,
    suggestion: null | {text: string, url: string},
  }

  export type GoogleSearchImages = Array<GoogleSearchImage>;

  export interface GoogleTranslate {
    from_language: GoogleLocales,
    from_text: string,
    translated_language: GoogleLocales,
    translated_text: string,
  }


  export interface GoogleSearchCard {
    description: null | string,
    fields: Array<{description: string, title: string}>,
    footer: null | string,
    header: null | string,
    image: null | string,
    thumbnail: null | string,
    title: string,
    type: GoogleCardTypes,
  }

  export interface GoogleSearchImage {
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
    thumbnail: {
      height: number,
      proxy_url: string,
      trusted: boolean,
      url: string,
      width: number,
    },
    url: string,
    video: null | {
      channel: null | string,
      description: string,
      duration: null | string,
      likes: null | string,
      title: string,
      type: GoogleImageVideoTypes,
      uploaded_at: null | number,
      views: null | number,
    },
  }

  export interface GoogleSearchResult {
    description: string,
    cite: string,
    suggestions: Array<{text: string, url: string}>,
    title: string,
    url: string,
    urls: Array<{text: string, url: string}>,
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

  export interface GuildPrefix {
    added: string,
    guild_id: string,
    prefix: string,
    user_id: string,
  }

  export interface YoutubeSearch {
    response: any,
    results: Array<YoutubeSearchResult>,
    suggestions: Array<string>,
    total_result_count: number,
  }

  export interface YoutubeSearchResult {
    description: string,
    metadata: any,
    thumbnail: {
      height: number,
      url: string,
      width: number,
    },
    title: string,
    type: number,
    url: string,
  }

  export interface YoutubeSearchResultMetadataChannel {
    badges: Array<string>,
    id: string,
    subscriber_count: string,
    vanity: null | string,
    video_count: number,
  }

  export interface YoutubeSearchResultMetadataMovie {
    channel: {
      badges: Array<string>,
      id: string,
      name: string,
      url: string,
      vanity: null | string,
    },
    duration: string,
    fields: Array<{name: string, value: string}>,
    genre: string,
    id: string,
    price: string,
  }

  export interface YoutubeSearchResultMetadataVideo {
    badges: Array<string>,
    channel: {
      badges: Array<string>,
      id: string,
      name: string,
      url: string,
      vanity: null | string,
    },
    duration: string,
    id: string,
    published: string,
    view_count: number,
  }
}
