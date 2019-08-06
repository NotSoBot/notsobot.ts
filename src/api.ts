import { Command } from 'detritus-client';
import { Types as RestTypes } from 'detritus-client-rest';
import {
  Constants as RestConstants,
  Response,
} from 'detritus-rest';


export const API_URL = 'https://beta.notsobot.com/api';


export async function request(
  context: Command.Context,
  options: RestTypes.RequestOptions,
): Promise<any> {
  options.url = API_URL;
  return context.rest.request(options);
}


export async function imageResize(
  context: Command.Context,
  options: {
    scale: number,
    url: string,
    userId: string,
  },
): Promise<Response> {
  return request(context, {
    dataOnly: false,
    body: {
      scale: options.scale,
      url: options.url,
    },
    headers: {
      'x-user': options.userId,
    },
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/image/resize',
    },
  });
}
