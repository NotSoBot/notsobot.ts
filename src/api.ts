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
  options.headers['x-user-id'] = context.userId;

  return context.rest.request(options);
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


export interface SearchGoogle {
  locale?: string,
  maxResults?: number,
  query: string,
  safe?: boolean | string,
  showUnknown?: boolean | string,
}

export async function searchGoogle(
  context: Command.Context,
  options: SearchGoogle,
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
      path: '/search/google',
    },
  });
}


export interface SearchGoogleImages {
  locale?: string,
  maxResults?: number,
  query: string,
  safe?: boolean | string,
}

export async function searchGoogleImages(
  context: Command.Context,
  options: SearchGoogleImages,
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
      path: '/search/google/images',
    },
  });
}


export interface SearchGoogleContentVisionOCR {
  url: string,
}

export async function searchGoogleContentVisionOCR(
  context: Command.Context,
  options: SearchGoogleContentVisionOCR,
): Promise<any> {
  const body = {
    url: options.url,
  };
  return request(context, {
    body,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/search/google/content-vision/ocr',
    },
  });
}


export interface SearchGoogleYoutube {
  query: string,
}

export async function searchGoogleYoutube(
  context: Command.Context,
  options: SearchGoogleYoutube,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/google/youtube',
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
