import { Command } from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';
import { Response, createHeaders } from 'detritus-rest';
import { HTTPMethods } from 'detritus-rest/lib/constants';

import { Api, LOCALHOST_API } from './endpoints';
import { RestOptions, RestResponsesRaw } from './types';

import {
  GoogleLocales,
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildDisableCommandsTypes,
  NotSoHeaders,
} from '../constants';


export async function request(
  context: Command.Context,
  options: RequestTypes.Options,
): Promise<any> {
  options.url = Api.URL + Api.PATH;
  options.headers = createHeaders(options.headers);

  if (Api.URL === LOCALHOST_API) {
    options.headers.set('host', 'beta.notsobot.com');
  }

  const token = process.env.NOTSOBOT_API_TOKEN;
  if (token) {
    options.headers.set(NotSoHeaders.AUTHORIZATION, `Bot ${token}`);
  }
  options.headers.set(NotSoHeaders.CHANNEL_ID, context.channelId);
  if (context.guildId) {
    options.headers.set(NotSoHeaders.GUILD_ID, context.guildId);
  }
  options.headers.set(NotSoHeaders.USER_ID, context.userId);

  const user = JSON.stringify({
    avatar: context.user.avatar,
    discriminator: context.user.discriminator,
    bot: context.user.bot,
    id: context.user.id,
    username: context.user.username,
  });
  options.headers.set(NotSoHeaders.USER, Buffer.from(user).toString('base64'));

  return context.rest.request(options);
}


export async function createGuildAllowlist(
  context: Command.Context,
  guildId: string,
  allowlistId: string,
  type: GuildAllowlistTypes,
): Promise<RestResponsesRaw.CreateGuildAllowlist> {
  return request(context, {
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD_ALLOWLIST,
      params: {allowlistId, guildId, type},
    },
  });
}


export async function createGuildBlocklist(
  context: Command.Context,
  guildId: string,
  blocklistId: string,
  type: GuildBlocklistTypes,
): Promise<RestResponsesRaw.CreateGuildBlocklist> {
  return request(context, {
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD_BLOCKLIST,
      params: {blocklistId, guildId, type},
    },
  });
}


export async function createGuildDisabledCommand(
  context: Command.Context,
  guildId: string,
  command: string,
  disabledId: string,
  type: GuildDisableCommandsTypes,
): Promise<RestResponsesRaw.CreateGuildDisabledCommand> {
  return request(context, {
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD_DISABLED_COMMAND,
      params: {command, disabledId, guildId, type},
    },
  });
}


export async function createGuildPrefix(
  context: Command.Context,
  guildId: string,
  prefix: string,
): Promise<RestResponsesRaw.CreateGuildPrefix> {
  const body = {prefix};
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD_PREFIXES,
      params,
    },
  });
}


export async function deleteGuildAllowlist(
  context: Command.Context,
  guildId: string,
  allowlistId: string,
  type: GuildAllowlistTypes,
): Promise<RestResponsesRaw.DeleteGuildAllowlist> {
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.GUILD_ALLOWLIST,
      params: {allowlistId, guildId, type},
    },
  });
}


export async function deleteGuildBlocklist(
  context: Command.Context,
  guildId: string,
  blocklistId: string,
  type: GuildBlocklistTypes,
): Promise<RestResponsesRaw.DeleteGuildBlocklist> {
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.GUILD_BLOCKLIST,
      params: {blocklistId, guildId, type},
    },
  });
}


export async function deleteGuildDisabledCommand(
  context: Command.Context,
  guildId: string,
  command: string,
  disabledId: string,
  type: GuildDisableCommandsTypes,
): Promise<RestResponsesRaw.DeleteGuildDisabledCommand> {
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.GUILD_DISABLED_COMMAND,
      params: {command, disabledId, guildId, type},
    },
  });
}


export async function deleteGuildPrefix(
  context: Command.Context,
  guildId: string,
  prefix: string,
): Promise<RestResponsesRaw.DeleteGuildPrefix> {
  const body = {prefix};
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.GUILD_PREFIXES_DELETE,
      params,
    },
  });
}


export async function editGuildSettings(
  context: Command.Context,
  guildId: string,
  options: RestOptions.EditGuildSettings = {},
): Promise<RestResponsesRaw.EditGuildSettings> {
  const body = {
    allowlist: options.allowlist,
    blocklist: options.blocklist,
    prefixes: options.prefixes,
  };
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PATCH,
      path: Api.GUILD,
      params,
    },
  });
}


export async function fetchGuildSettings(
  context: Command.Context,
  guildId: string,
): Promise<RestResponsesRaw.FetchGuildSettings> {
  const params = {guildId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.GUILD,
      params,
    },
  });
}


export async function googleContentVisionOCR(
  context: Command.Context,
  options: RestOptions.GoogleContentVisionOCR,
): Promise<RestResponsesRaw.GoogleContentVisionOCR> {
  const body = {
    url: options.url,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.GOOGLE_CONTENT_VISION_OCR,
    },
  });
}


export async function googleSearch(
  context: Command.Context,
  options: RestOptions.GoogleSearch,
): Promise<RestResponsesRaw.GoogleSearch> {
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
      method: HTTPMethods.GET,
      path: Api.GOOGLE_SEARCH,
    },
  });
}


export async function googleSearchImages(
  context: Command.Context,
  options: RestOptions.GoogleSearchImages,
): Promise<RestResponsesRaw.GoogleSearchImages> {
  const query = {
    locale: options.locale,
    max_results: options.maxResults,
    query: options.query,
    safe: options.safe,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.GOOGLE_SEARCH_IMAGES,
    },
  });
}


export async function googleTranslate(
  context: Command.Context,
  options: RestOptions.GoogleTranslate,
): Promise<RestResponsesRaw.GoogleTranslate> {
  const query = {
    from: options.from,
    text: options.text,
    to: options.to,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.GOOGLE_TRANSLATE,
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
      method: HTTPMethods.POST,
      path: Api.IMAGE_JPEG,
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
      method: HTTPMethods.POST,
      path: Api.IMAGE_MAGIK,
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
      method: HTTPMethods.POST,
      path: Api.IMAGE_MAGIK_GIF,
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
      method: HTTPMethods.POST,
      path: Api.IMAGE_MIRROR_BOTTOM,
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
      method: HTTPMethods.POST,
      path: Api.IMAGE_MIRROR_LEFT,
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
      method: HTTPMethods.POST,
      path: Api.IMAGE_MIRROR_RIGHT,
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
      method: HTTPMethods.POST,
      path: Api.IMAGE_MIRROR_TOP,
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
      method: HTTPMethods.POST,
      path: Api.IMAGE_RESIZE,
    },
  });
}


export async function putGuildSettings(
  context: Command.Context,
  guildId: string,
  options: RestOptions.PutGuildSettings,
): Promise<RestResponsesRaw.EditGuildSettings> {
  const params = {guildId};
  return request(context, {
    body: options,
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD,
      params,
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
      method: HTTPMethods.GET,
      path: Api.SEARCH_DUCKDUCKGO,
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
      method: HTTPMethods.GET,
      path: Api.SEARCH_DUCKDUCKGO_IMAGES,
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
      method: HTTPMethods.GET,
      path: Api.SEARCH_E621,
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
      method: HTTPMethods.GET,
      path: Api.SEARCH_E926,
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
      method: HTTPMethods.GET,
      path: Api.SEARCH_RULE34,
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
      method: HTTPMethods.GET,
      path: Api.SEARCH_RULE34_PAHEAL,
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
      method: HTTPMethods.GET,
      path: Api.SEARCH_URBAN_DICTIONARY,
    },
  });
}


export async function searchUrbanRandom(
  context: Command.Context,
  options: RestOptions.SearchUrbanRandom = {},
): Promise<any> {
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_URBAN_DICTIONARY_RANDOM,
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
      method: HTTPMethods.GET,
      path: Api.SEARCH_WOLFRAM_ALPHA,
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
      method: HTTPMethods.PUT,
      path: Api.COMMANDS,
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
      method: HTTPMethods.GET,
      path: Api.YOUTUBE_SEARCH,
    },
  });
}
