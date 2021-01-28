import { ShardClient, Structures } from 'detritus-client';
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



export interface RequestContext {
  channelId?: string,
  client: ShardClient,
  guildId?: string,
  user?: Structures.User,
}

export async function request(
  context: RequestContext,
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

  const { channelId, client, guildId, user } = context;
  if (channelId) {
    options.headers.set(NotSoHeaders.CHANNEL_ID, channelId);
  }
  if (guildId) {
    options.headers.set(NotSoHeaders.GUILD_ID, guildId);
  }
  if (user) {
    options.headers.set(NotSoHeaders.USER_ID, user.id);
    const bareUser = JSON.stringify({
      avatar: user.avatar,
      discriminator: user.discriminator,
      bot: user.bot,
      id: user.id,
      username: user.username,
    });
    options.headers.set(NotSoHeaders.USER, Buffer.from(bareUser).toString('base64'));
  }

  return client.rest.request(options);
}


export async function createGuildAllowlist(
  context: RequestContext,
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
  context: RequestContext,
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
  context: RequestContext,
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


export async function createGuildLogger(
  context: RequestContext,
  guildId: string,
  options: RestOptions.CreateGuildLogger,
): Promise<RestResponsesRaw.CreateGuildLogger> {
  const body = {
    channel_id: options.channelId,
    type: options.type,
    webhook_id: options.webhookId,
    webhook_token: options.webhookToken,
  };
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD_LOGGERS,
      params,
    },
  });
}


export async function createGuildPrefix(
  context: RequestContext,
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


export async function createUserCommand(
  context: RequestContext,
  userId: string,
  command: string,
  options: RestOptions.CreateUserCommand,
): Promise<RestResponsesRaw.CreateUserCommand> {
  const body = {
    channel_id: options.channelId,
    content: options.content,
    content_url: options.contentUrl,
    edited_timestamp: options.editedTimestamp,
    failed_reason: options.failedReason,
    guild_id: options.guildId,
    message_id: options.messageId,
    response_id: options.responseId,
    response_url: options.responseUrl,
  };
  const params = {userId, command};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.USER_COMMAND,
      params,
    },
  });
}


export async function deleteGuildAllowlist(
  context: RequestContext,
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
  context: RequestContext,
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
  context: RequestContext,
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


export async function deleteGuildLogger(
  context: RequestContext,
  guildId: string,
  options: RestOptions.DeleteGuildLogger,
): Promise<RestResponsesRaw.DeleteGuildLogger> {
  const body = {
    channel_id: options.channelId,
    type: options.type,
  };
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.GUILD_LOGGERS_DELETE,
      params,
    },
  });
}


export async function deleteGuildPrefix(
  context: RequestContext,
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
  context: RequestContext,
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
  context: RequestContext,
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


export async function fetchUser(
  context: RequestContext,
  userId: string,
): Promise<RestResponsesRaw.FetchUser> {
  const params = {userId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.USER,
      params,
    },
  });
}


export async function funASCII(
  context: RequestContext,
  options: RestOptions.FunASCII,
): Promise<RestResponsesRaw.FunAscii> {
  const query = {
    text: options.text,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.FUN_ASCII,
    },
  });
}


export async function googleContentVisionOCR(
  context: RequestContext,
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


export async function googleContentVisionWebDetection(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionWebDetection,
): Promise<RestResponsesRaw.GoogleContentVisionWebDetection> {
  const body = {
    url: options.url,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.GOOGLE_CONTENT_VISION_WEB_DETECTION,
    },
  });
}


export async function googleTranslate(
  context: RequestContext,
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




export async function imageAscii(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_ASCII,
    },
  });
}


export async function imageAsciiGif(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_ASCII_GIF,
    },
  });
}


export async function imageDeepfry(
  context: RequestContext,
  options: RestOptions.ImageDeepfry,
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
      path: Api.IMAGE_DEEPFRY,
    },
  });
}


export async function imageDeepfryGif(
  context: RequestContext,
  options: RestOptions.ImageDeepfry,
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
      path: Api.IMAGE_DEEPFRY_GIF,
    },
  });
}


export async function imageExplode(
  context: RequestContext,
  options: RestOptions.ImageExplode,
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
      path: Api.IMAGE_EXPLODE,
    },
  });
}


export async function imageEyes(
  context: RequestContext,
  options: RestOptions.ImageEyes,
): Promise<Response> {
  const query = {
    type: options.type,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_EYES,
    },
  });
}


export async function imageGlitch(
  context: RequestContext,
  options: RestOptions.ImageGlitch,
): Promise<Response> {
  const query = {
    amount: options.amount,
    iterations: options.iterations,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_GLITCH,
    },
  });
}


export async function imageGlitchGif(
  context: RequestContext,
  options: RestOptions.ImageGlitch,
): Promise<Response> {
  const query = {
    amount: options.amount,
    iterations: options.iterations,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_GLITCH_GIF,
    },
  });
}


export async function imageGrayscale(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_GRAYSCALE,
    },
  });
}


export async function imageGrayscaleGif(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_GRAYSCALE_GIF,
    },
  });
}


export async function imageImplode(
  context: RequestContext,
  options: RestOptions.ImageImplode,
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
      path: Api.IMAGE_IMPLODE,
    },
  });
}


export async function imageInvert(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_INVERT,
    },
  });
}


export async function imageJPEG(
  context: RequestContext,
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


export async function imageLegofy(
  context: RequestContext,
  options: RestOptions.ImageLegofy,
): Promise<Response> {
  const query = {
    dither: options.dither,
    palette: options.palette,
    size: options.size,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_LEGOFY,
    },
  });
}


export async function imageMagik(
  context: RequestContext,
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
  context: RequestContext,
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
      path: Api.IMAGE_MAGIK_GIF,
    },
  });
}


export async function imageMeme(
  context: RequestContext,
  options: RestOptions.ImageMeme,
): Promise<Response> {
  const query = {
    bottom: options.bottom,
    top: options.top,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_MEME,
    },
  });
}


export async function imageMirrorBottom(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
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
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
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
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
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
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
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


export async function imageOverlayGay(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_OVERLAY_GAY,
    },
  });
}


export async function imagePixelate(
  context: RequestContext,
  options: RestOptions.ImagePixelate,
): Promise<Response> {
  const query = {
    pixel_width: options.pixelWidth,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_PIXELATE,
    },
  });
}


export async function imageSharpen(
  context: RequestContext,
  options: RestOptions.ImageSharpen,
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
      path: Api.IMAGE_SHARPEN,
    },
  });
}


export async function imageSpin(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_SPIN,
    },
  });
}


export async function imageTombstone(
  context: RequestContext,
  options: RestOptions.ImageTombstone,
) {
  const query = {
    line_1: options.line1,
    line_2: options.line2,
    line_3: options.line3,
    line_4: options.line4,
    line_5: options.line5,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_TOMBSTONE,
    },
  });
}


export async function imageToolsResize(
  context: RequestContext,
  options: RestOptions.ImageToolsResize,
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
      path: Api.IMAGE_TOOLS_RESIZE,
    },
  });
}


export async function imageToolsBackgroundRemove(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_TOOLS_BACKGROUND_REMOVE,
    },
  });
}


export async function imageToolsRotate(
  context: RequestContext,
  options: RestOptions.ImageToolsRotate,
): Promise<Response> {
  const query = {
    degrees: options.degrees,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_TOOLS_ROTATE,
    },
  });
}


export async function imageWall(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_WALL,
    },
  });
}


export async function putGuildSettings(
  context: RequestContext,
  guildId: string,
  options: RestOptions.PutGuildSettings,
): Promise<RestResponsesRaw.EditGuildSettings> {
  const body = {
    icon: options.icon,
    name: options.name,
  };
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD,
      params,
    },
  });
}

export async function putUser(
  context: RequestContext,
  userId: string,
  options: RestOptions.PutUser,
): Promise<RestResponsesRaw.PutUser> {
  const body = {
    avatar: options.avatar,
    bot: options.bot,
    discriminator: options.discriminator,
    username: options.username,
  };
  const params = {userId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.USER,
      params,
    },
  });
}


export async function searchDuckDuckGo(
  context: RequestContext,
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
  context: RequestContext,
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
  context: RequestContext,
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
  context: RequestContext,
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


export async function searchGoogle(
  context: RequestContext,
  options: RestOptions.SearchGoogle,
): Promise<RestResponsesRaw.SearchGoogle> {
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
      path: Api.SEARCH_GOOGLE,
    },
  });
}


export async function searchGoogleImages(
  context: RequestContext,
  options: RestOptions.SearchGoogleImages,
): Promise<RestResponsesRaw.SearchGoogleImages> {
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
      path: Api.SEARCH_GOOGLE_IMAGES,
    },
  });
}


export async function searchGoogleReverseImages(
  context: RequestContext,
  options: RestOptions.SearchGoogleReverseImages,
): Promise<RestResponsesRaw.SearchGoogleReverseImages> {
  const query = {
    url: options.url,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.SEARCH_GOOGLE_REVERSE_IMAGES,
    },
  });
}


export async function searchReddit(
  context: RequestContext,
  options: RestOptions.SearchReddit,
): Promise<any> {
  const query = {
    query: options.query,
    safe: options.safe,
    sort: options.sort,
    subreddit: options.subreddit,
    time: options.time,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_REDDIT,
    },
  });
}


export async function searchRule34(
  context: RequestContext,
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
  context: RequestContext,
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


export async function searchSteam(
  context: RequestContext,
  options: RestOptions.SearchSteam,
): Promise<RestResponsesRaw.SearchSteam> {
  const query = {
    query: options.query,
    steam_id: options.steamId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_STEAM,
    },
  });
}


export async function searchSteamProfile(
  context: RequestContext,
  options: RestOptions.SearchSteamProfile,
): Promise<RestResponsesRaw.SearchSteamProfile> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_STEAM_PROFILE,
    },
  });
}


export async function searchUrban(
  context: RequestContext,
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
  context: RequestContext,
  options: RestOptions.SearchUrbanRandom = {},
): Promise<any> {
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_URBAN_DICTIONARY_RANDOM,
    },
  });
}


export async function searchWikihow(
  context: RequestContext,
  options: RestOptions.SearchWikihow,
): Promise<RestResponsesRaw.SearchWikihow> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_WIKIHOW,
    },
  });
}


export async function searchWikihowRandom(
  context: RequestContext,
  options: RestOptions.SearchWikihowRandom = {},
): Promise<RestResponsesRaw.SearchWikihowRandom> {
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_WIKIHOW_RANDOM,
    },
  });
}


export async function searchWolframAlpha(
  context: RequestContext,
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


export async function searchYoutube(
  context: RequestContext,
  options: RestOptions.SearchYoutube,
): Promise<RestResponsesRaw.SearchYoutube> {
  const query = {
    query: options.query,
    sp: options.sp,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_YOUTUBE,
    },
  });
}


export async function uploadCommands(
  context: RequestContext,
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
