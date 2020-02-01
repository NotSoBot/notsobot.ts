import { Command } from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';
import {
  Constants as RestConstants,
  Response,
} from 'detritus-rest';

import {
  GoogleLocales,
  GuildBlacklistTypes,
  GuildDisableCommandsTypes,
} from './constants';

import { RestOptions, RestResponses } from './types';


export const API_URL = 'https://beta.notsobot.com/api';


export async function request(
  context: Command.Context,
  options: RequestTypes.RequestOptions,
): Promise<any> {
  options.url = API_URL;
  options.headers = Object.assign({}, options.headers);

  const token = process.env.NOTSOBOT_API_TOKEN;
  if (token) {
    options.headers.authorization = `Bot ${token}`;
  }
  options.headers['x-channel-id'] = context.channelId;
  if (context.guildId) {
    options.headers['x-guild-id'] = context.guildId;
  }
  options.headers['x-user-id'] = context.userId;

  return context.rest.request(options);
}


export async function createGuildBlacklist(
  context: Command.Context,
  guildId: string,
  blacklistId: string,
  type: GuildBlacklistTypes,
): Promise<RestResponses.CreateGuildBlacklist> {
  return request(context, {
    body: {type},
    route: {
      method: RestConstants.HTTPMethods.PUT,
      path: '/guilds/:guildId/blacklist/:blacklistId',
      params: {blacklistId, guildId},
    },
  });
}


export async function createGuildDisabledCommand(
  context: Command.Context,
  guildId: string,
  command: string,
  disabledId: string,
  type: GuildDisableCommandsTypes,
): Promise<RestResponses.CreateGuildDisabledCommand> {
  return request(context, {
    body: {type},
    route: {
      method: RestConstants.HTTPMethods.PUT,
      path: '/guilds/:guildId/disabled-commands/:command/:disabledId',
      params: {command, disabledId, guildId},
    },
  });
}


export async function createGuildPrefix(
  context: Command.Context,
  guildId: string,
  prefix: string,
): Promise<RestResponses.CreateGuildPrefix> {
  const body = {prefix};
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: RestConstants.HTTPMethods.PUT,
      path: '/guilds/:guildId/prefixes',
      params,
    },
  });
}


export async function deleteGuildBlacklist(
  context: Command.Context,
  guildId: string,
  blacklistId: string,
): Promise<RestResponses.DeleteGuildBlacklist> {
  return request(context, {
    route: {
      method: RestConstants.HTTPMethods.DELETE,
      path: '/guilds/:guildId/blacklist/:blacklistId',
      params: {blacklistId, guildId},
    },
  });
}


export async function deleteGuildDisabledCommand(
  context: Command.Context,
  guildId: string,
  command: string,
  disabledId: string,
): Promise<RestResponses.DeleteGuildDisabledCommand> {
  return request(context, {
    route: {
      method: RestConstants.HTTPMethods.DELETE,
      path: '/guilds/:guildId/disabled-commands/:command/:disabledId',
      params: {command, disabledId, guildId},
    },
  });
}


export async function deleteGuildPrefix(
  context: Command.Context,
  guildId: string,
  prefix: string,
): Promise<RestResponses.DeleteGuildPrefix> {
  const body = {prefix};
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/guilds/:guildId/prefixes/delete',
      params,
    },
  });
}


export async function editGuildSettings(
  context: Command.Context,
  guildId: string,
  options: RestOptions.EditGuildSettings = {},
): Promise<RestResponses.EditGuildSettings> {
  const body = {
    prefixes: options.prefixes,
  };
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: RestConstants.HTTPMethods.PATCH,
      path: '/guilds/:guildId',
      params,
    },
  });
}


export async function fetchGuildSettings(
  context: Command.Context,
  guildId: string,
): Promise<RestResponses.EditGuildSettings> {
  const params = {guildId};
  return request(context, {
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/guilds/:guildId',
      params,
    },
  });
}


export async function googleContentVisionOCR(
  context: Command.Context,
  options: RestOptions.GoogleContentVisionOCR,
): Promise<RestResponses.GoogleContentVisionOCR> {
  const body = {
    url: options.url,
  };
  return request(context, {
    body,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/google/content-vision/ocr',
    },
  });
}


export async function googleSearch(
  context: Command.Context,
  options: RestOptions.GoogleSearch,
): Promise<RestResponses.GoogleSearch> {
  const query = {
    locale: options.locale,
    max_results: options.maxResults,
    query: options.query,
    safe: options.safe,
    show_unknown: options.showUnknown,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/google/search',
    },
  });
}


export interface GoogleSearchImages {
  locale?: GoogleLocales,
  maxResults?: number,
  query: string,
  safe?: boolean | string,
}

export async function googleSearchImages(
  context: Command.Context,
  options: GoogleSearchImages,
): Promise<any> {
  const query = {
    locale: options.locale,
    max_results: options.maxResults,
    query: options.query,
    safe: options.safe,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/google/search/images',
    },
  });
}


export interface GoogleTranslate {
  from?: GoogleLocales,
  text: string,
  to?: GoogleLocales,
}

export async function googleTranslate(
  context: Command.Context,
  options: GoogleTranslate,
): Promise<{
  from_language: GoogleLocales,
  from_text: string,
  translated_language: GoogleLocales,
  translated_text: string,
}> {
  const query = {
    from: options.from,
    text: options.text,
    to: options.to,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/google/translate',
    },
  });
}



export interface ImageMagik {
  url: string,
}

export async function imageMagik(
  context: Command.Context,
  options: ImageMagik,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/image/magik',
    },
  });
}


export interface ImageMagikGif {
  url: string,
}

export async function imageMagikGif(
  context: Command.Context,
  options: ImageMagikGif,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/image/magik-gif',
    },
  });
}


export interface ImageMirrorBottom {
  url: string,
}

export async function imageMirrorBottom(
  context: Command.Context,
  options: ImageMirrorBottom,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/image/mirror-bottom',
    },
  });
}


export interface ImageMirrorLeft {
  url: string,
}

export async function imageMirrorLeft(
  context: Command.Context,
  options: ImageMirrorLeft,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/image/mirror-left',
    },
  });
}


export interface ImageMirrorRight {
  url: string,
}

export async function imageMirrorRight(
  context: Command.Context,
  options: ImageMirrorRight,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/image/mirror-right',
    },
  });
}


export interface ImageMirrorTop {
  url: string,
}

export async function imageMirrorTop(
  context: Command.Context,
  options: ImageMirrorTop,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/image/mirror-top',
    },
  });
}


export interface ImageResize {
  convert?: string,
  scale?: number,
  size?: string,
  url: string,
}

export async function imageResize(
  context: Command.Context,
  options: ImageResize,
): Promise<Response> {
  const query = {
    convert: options.convert,
    scale: options.scale,
    size: options.size,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/image/resize',
    },
  });
}



export interface SearchDuckDuckGo {
  query: string,
}

export async function searchDuckDuckGo(
  context: Command.Context,
  options: SearchDuckDuckGo,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/duckduckgo',
    },
  });
}


export interface SearchDuckDuckGoImages {
  query: string,
}

export async function searchDuckDuckGoImages(
  context: Command.Context,
  options: SearchDuckDuckGoImages,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/duckduckgo/images',
    },
  });
}


export interface SearchRule34 {
  query: string,
}

export async function searchRule34(
  context: Command.Context,
  options: SearchRule34,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/rule34',
    },
  });
}


export interface SearchRule34Paheal {
  query: string,
}

export async function searchRule34Paheal(
  context: Command.Context,
  options: SearchRule34Paheal,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/rule34-paheal',
    },
  });
}


export interface SearchUrban {
  query: string,
}

export async function searchUrban(
  context: Command.Context,
  options: SearchUrban,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/urban-dictionary',
    },
  });
}


export interface SearchUrbanRandom {

}

export async function searchUrbanRandom(
  context: Command.Context,
  options: SearchUrbanRandom = {},
): Promise<any> {
  return request(context, {
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/urban-dictionary/random',
    },
  });
}


export interface SearchWolframAlpha {
  query: string,
}

export async function searchWolframAlpha(
  context: Command.Context,
  options: SearchWolframAlpha,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/wolfram-alpha',
    },
  });
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

export async function uploadCommands(
  context: Command.Context,
  options: UploadCommands,
): Promise<any> {
  const body = {
    commands: options.commands,
  };
  return request(context, {
    body,
    route: {
      method: RestConstants.HTTPMethods.PUT,
      path: '/commands',
    },
  });
}


export interface YoutubeSearch {
  query: string,
}

export async function youtubeSearch(
  context: Command.Context,
  options: YoutubeSearch,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/youtube/search',
    },
  });
}
