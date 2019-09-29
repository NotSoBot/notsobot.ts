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

  if (options.userId) {
    options.headers['x-user-id'] = options.userId;
  }
  return context.rest.request(options);
}


export interface ImageResize {
  convert?: string,
  scale?: number,
  size?: string,
  url: string,
  userId: string,
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
    userId: options.userId,
  });
}


export interface SearchGoogle {
  language?: string,
  maxResults?: number,
  query: string,
  safe?: boolean | string,
  showUnknown?: boolean | string,
  userId: string,
}

export async function searchGoogle(
  context: Command.Context,
  options: SearchGoogle,
): Promise<any> {
  const query = {
    language: options.language,
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
    userId: options.userId,
  });
}
