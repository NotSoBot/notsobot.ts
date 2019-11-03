import { GoogleCardTypes, GoogleLocales } from './constants';


export namespace RestOptions {
  export interface EditGuildSettings {
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

  export interface GoogleTranslate {
    from?: GoogleLocales,
    text: string,
    to?: GoogleLocales,
  }
}


export namespace RestResponses {

  export type CreateGuildBlacklist = null;
  export type CreateGuildDisabledCommand = null;
  export type CreateGuildPrefix = Array<GuildPrefix>;

  export type DeleteGuildBlacklist = null;
  export type DeleteGuildDisabledCommand = null;
  export type DeleteGuildPrefix = Array<GuildPrefix>;

  export type EditGuildSettings = GuildSettings;

  export interface GoogleSearch {
    cards: Array<GoogleSearchCard>,
    results: Array<GoogleSearchResult>,
    suggestion: null | {text: string, url: string},
  }

  export interface GoogleContentVisionOCR {
    annotation: null | {description: string, locale: GoogleLocales},
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

  export interface GoogleSearchResult {
    description: string,
    cite: string,
    suggestions: Array<{text: string, url: string}>,
    title: string,
    url: string,
    urls: Array<{text: string, url: string}>,
  }

  export interface GuildSettings {
    blacklist: Array<GuildBlacklist>,
    disabled_commands: Array<GuildDisabledCommand>,
    icon: string | null,
    id: string,
    name: string,
    prefixes: Array<GuildPrefix>,
  }

  export interface GuildBlacklist {
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
