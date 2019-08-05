import { URL } from 'url';

import {
  Constants as RestConstants,
  Response,
} from 'detritus-rest';

import {
  Client as RestClient,
  Types as RestTypes,
} from 'detritus-client-rest';


export class ApiClient {
  rest: RestClient;
  url: string | URL;

  constructor(
    rest: RestClient,
    url: string | URL,
  ) {
    this.rest = rest;
    this.url = url;
  }

  async request(
    options: RestTypes.RequestOptions,
  ): Promise<any> {
    options.url = this.url;
    return this.rest.request(options);
  }

  async imageResize(
    options: {
      size: number,
      url: string,
      userId: string,
    },
  ): Promise<Response> {
    return this.request({
      dataOnly: false,
      body: {
        size: options.size,
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
}
