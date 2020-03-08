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


export async function googleSearchImages(
  context: Command.Context,
  options: RestOptions.GoogleSearchImages,
): Promise<RestResponses.GoogleSearchImages> {
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


export async function googleTranslate(
  context: Command.Context,
  options: RestOptions.GoogleTranslate,
): Promise<RestResponses.GoogleTranslate> {
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


export async function imageJPEG(
  context: Command.Context,
  options: RestOptions.ImageJPEG,
): Promise<Response> {
  const query = {
    quality: options.quality,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: RestConstants.HTTPMethods.POST,
      path: '/image/jpeg',
    },
  });
}


export async function imageMagik(
  context: Command.Context,
  options: RestOptions.ImageMagik,
): Promise<Response> {
  const query = {
    scale: options.scale,
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


export async function imageMagikGif(
  context: Command.Context,
  options: RestOptions.ImageMagikGif,
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


export async function imageMirrorBottom(
  context: Command.Context,
  options: RestOptions.ImageMirrorBottom,
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


export async function imageMirrorLeft(
  context: Command.Context,
  options: RestOptions.ImageMirrorLeft,
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


export async function imageMirrorRight(
  context: Command.Context,
  options: RestOptions.ImageMirrorRight,
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


export async function imageMirrorTop(
  context: Command.Context,
  options: RestOptions.ImageMirrorTop,
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


export async function imageResize(
  context: Command.Context,
  options: RestOptions.ImageResize,
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


export async function searchDuckDuckGo(
  context: Command.Context,
  options: RestOptions.SearchDuckDuckGo,
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


export async function searchDuckDuckGoImages(
  context: Command.Context,
  options: RestOptions.SearchDuckDuckGoImages,
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


export async function searchE621(
  context: Command.Context,
  options: RestOptions.SearchE621,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/e621',
    },
  });
}


export async function searchE926(
  context: Command.Context,
  options: RestOptions.SearchE926,
): Promise<any> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/e926',
    },
  });
}


export async function searchRule34(
  context: Command.Context,
  options: RestOptions.SearchRule34,
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


export async function searchRule34Paheal(
  context: Command.Context,
  options: RestOptions.SearchRule34Paheal,
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


export async function searchUrban(
  context: Command.Context,
  options: RestOptions.SearchUrban,
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


export async function searchUrbanRandom(
  context: Command.Context,
  options: RestOptions.SearchUrbanRandom = {},
): Promise<any> {
  return request(context, {
    route: {
      method: RestConstants.HTTPMethods.GET,
      path: '/search/urban-dictionary/random',
    },
  });
}


export async function searchWolframAlpha(
  context: Command.Context,
  options: RestOptions.SearchWolframAlpha,
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


export async function uploadCommands(
  context: Command.Context,
  options: RestOptions.UploadCommands,
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


export async function youtubeSearch(
  context: Command.Context,
  options: RestOptions.YoutubeSearch,
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
