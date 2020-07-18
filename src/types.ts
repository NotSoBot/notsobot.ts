import { GoogleCardTypes, GoogleImageVideoTypes, GoogleLocales } from './constants';


export namespace RedisPayloads {
  export interface GuildAllowlistUpdate {
    allowlist: Array<RestResponses.GuildAllowlist>,
    id: string,
  }

  export interface GuildBlocklistUpdate {
    allowlist: Array<RestResponses.GuildBlocklist>,
    id: string,
  }

  export interface GuildDisabledCommandUpdate {
    disabled_commands: Array<RestResponses.GuildDisabledCommand>,
    id: string,
  }

  export interface GuildPrefixUpdate {
    id: string,
    prefixes: Array<RestResponses.GuildPrefix>,
  }

  export type GuildSettingsUpdate = RestResponses.GuildSettings;
}


export namespace RestResponses {

  export type CreateGuildAllowlist = null;
  export type CreateGuildBlocklist = null;
  export type CreateGuildDisabledCommand = null;
  export type CreateGuildPrefix = Array<GuildPrefix>;

  export type DeleteGuildAllowlist = null;
  export type DeleteGuildBlocklist = null;
  export type DeleteGuildDisabledCommand = null;
  export type DeleteGuildPrefix = Array<GuildPrefix>;

  export type EditGuildSettings = GuildSettings;

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
}
