import { Command } from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';
import {
  Constants as RestConstants,
  Response,
} from 'detritus-rest';


export const API_URL = 'https://beta.notsobot.com/api';

export interface ApiRequestOptions extends RequestTypes.RequestOptions {
  userId?: string,
}


export async function request(
  context: Command.Context,
  options: ApiRequestOptions,
): Promise<any> {
  options.url = API_URL;
  options.headers = Object.assign({}, options.headers);

  const token = process.env.NOTSOBOT_API_TOKEN;
  if (token) {
    options.headers.authorization = token;
  }
  options.headers['x-channel-id'] = context.channelId;
  if (context.guildId) {
    options.headers['x-guild-id'] = context.guildId;
  }
  options.headers['x-user-id'] = context.userId;

  return context.rest.request(options);
}


export interface GoogleContentVisionOCR {
  url: string,
}

export async function googleContentVisionOCR(
  context: Command.Context,
  options: GoogleContentVisionOCR,
): Promise<any> {
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


export interface GoogleSearch {
  locale?: string,
  maxResults?: number,
  query: string,
  safe?: boolean | string,
  showUnknown?: boolean | string,
}

export async function googleSearch(
  context: Command.Context,
  options: GoogleSearch,
): Promise<any> {
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
  locale?: string,
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
  from?: string,
  text: string,
  to?: string,
}

export async function googleTranslate(
  context: Command.Context,
  options: GoogleTranslate,
): Promise<any> {
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
