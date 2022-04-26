import { ShardClient, Structures } from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';
import { Response, createHeaders } from 'detritus-rest';
import { HTTPMethods } from 'detritus-rest/lib/constants';

import { Api, Domains } from './endpoints';
import { RestOptions, RestResponsesRaw, RestResponses } from './types';

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
  inDm?: boolean,
  user?: Structures.User,
}

export async function request(
  context: RequestContext,
  options: RequestTypes.Options,
): Promise<any> {
  options.url = Api.URL + Api.PATH;
  options.headers = createHeaders(options.headers);

  if (Api.URL === Domains.LOCALHOST) {
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
      channel_id: (context.inDm) ? context.channelId : undefined,
      bot: user.bot,
      id: user.id,
      username: user.username,
    });
    options.headers.set(NotSoHeaders.USER, Buffer.from(bareUser).toString('base64'));
  }

  return client.rest.request(options);
}


export async function audioToolsConvert(
  context: RequestContext,
  options: RestOptions.AudioToolsConvertOptions,
): Promise<Response> {
  const query = {
    to: options.to,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.AUDIO_TOOLS_CONVERT,
    },
  });
}


export async function audioToolsIdentify(
  context: RequestContext,
  options: RestOptions.AudioBaseOptions,
): Promise<RestResponsesRaw.AudioToolsIdentify> {
  const query = {
    url: options.url,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.AUDIO_TOOLS_IDENTIFY,
    },
  });
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


export async function createReminder(
  context: RequestContext,
  options: RestOptions.CreateReminder,
): Promise<RestResponsesRaw.CreateReminder> {
  const body = {
    channel_id: options.channelId,
    content: options.content,
    guild_id: options.guildId,
    is_all_day: options.isAllDay,
    message_id: options.messageId,
    timestamp_end: options.timestampEnd,
    timestamp_start: options.timestampStart,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.REMINDERS,
    },
  });
}


export async function createTagUse(
  context: RequestContext,
  tagId: string,
  options: RestOptions.CreateTagUse,
): Promise<RestResponsesRaw.CreateTagUse> {
  const body = {
    timestamp: options.timestamp,
    user_id: options.userId,
  };
  const params = {tagId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.TAG_USE,
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
    edited_timestamp: options.editedTimestamp,
    failed_reason: options.failedReason,
    guild_id: options.guildId,
    message_id: options.messageId,
    response_id: options.responseId,
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


export async function deleteChannel(
  context: RequestContext,
  channelId: string,
  options: RestOptions.DeleteChannel,
): Promise<RestResponsesRaw.DeleteChannel> {
  return request(context, {
    query: {
      guild_id: options.guildId,
    },
    route: {
      method: HTTPMethods.DELETE,
      path: Api.CHANNEL,
      params: {channelId},
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


export async function deleteReminder(
  context: RequestContext,
  reminderId: string,
): Promise<RestResponsesRaw.DeleteReminder> {
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.REMINDER,
      params: {reminderId},
    },
  });
}


export async function deleteTag(
  context: RequestContext,
  options: RestOptions.DeleteTag,
): Promise<RestResponsesRaw.DeleteTag> {
  const query = {
    name: options.name,
    server_id: options.serverId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.DELETE,
      path: Api.TAGS,
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
    blocked: options.blocked,
    blocklist: options.blocklist,
    disabled_commands: options.disabledCommands,
    prefixes: options.prefixes,
    timezone: options.timezone,
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


export async function editUser(
  context: RequestContext,
  userId: string,
  options: RestOptions.EditUser,
): Promise<RestResponsesRaw.EditUser> {
  const body = {
    blocked: options.blocked,
    channel_id: options.channelId,
    locale: options.locale,
    opt_out_content: options.optOutContent,
    timezone: options.timezone,
  };
  const params = {userId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PATCH,
      path: Api.USER,
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


export async function fetchReminders(
  context: RequestContext,
  options: RestOptions.FetchReminders = {},
): Promise<RestResponsesRaw.FetchReminders> {
  const query = {
    after: options.after,
    before: options.before,
    guild_id: options.guildId,
    limit: options.limit,
    timestamp_max: options.timestampMax,
    timestamp_min: options.timestampMin,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.REMINDERS,
    },
  });
}


export async function fetchTag(
  context: RequestContext,
  options: RestOptions.FetchTag,
): Promise<RestResponsesRaw.FetchTag> {
  const query = {
    name: options.name,
    server_id: options.serverId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAGS,
    },
  });
}


export async function fetchTagRandom(
  context: RequestContext,
  options: RestOptions.FetchTagRandom = {},
): Promise<RestResponsesRaw.FetchTagRandom> {
  const query = {
    content: options.content,
    name: options.name,
    server_id: options.serverId,
    user_id: options.userId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAGS_RANDOM,
    },
  });
}


export async function fetchTagsServer(
  context: RequestContext,
  serverId: string,
  options: RestOptions.FetchTagsServer = {},
): Promise<RestResponsesRaw.FetchTagsServer> {
  const params = {serverId};
  const query = {
    after: options.after,
    before: options.before,
    content: options.content,
    limit: options.limit,
    name: options.name,
    user_id: options.userId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAGS_SERVER,
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


export async function fetchUserTags(
  context: RequestContext,
  userId: string,
  options: RestOptions.FetchUserTags = {},
): Promise<RestResponsesRaw.FetchUserTags> {
  const params = {userId};
  const query = {
    after: options.after,
    before: options.before,
    content: options.content,
    limit: options.limit,
    name: options.name,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.USER_TAGS,
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


export async function funTextToSpeech(
  context: RequestContext,
  options: RestOptions.FunTextToSpeech,
): Promise<Response> {
  const query = {
    text: options.text,
    voice: options.voice,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.FUN_TEXT_TO_SPEECH,
    },
  });
}



export async function googleContentVisionLabels(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionBase,
): Promise<RestResponsesRaw.GoogleContentVisionLabels> {
  const body = {
    url: options.url,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.GOOGLE_CONTENT_VISION_LABELS,
    },
  });
}


export async function googleContentVisionOCR(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionBase,
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


export async function googleContentVisionSafeSearch(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionBase,
): Promise<RestResponsesRaw.GoogleContentVisionSafeSearch> {
  const body = {
    url: options.url,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.GOOGLE_CONTENT_VISION_SAFE_SEARCH,
    },
  });
}


export async function googleContentVisionWebDetection(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionBase,
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


export async function imageCreateTombstone(
  context: RequestContext,
  options: RestOptions.ImageCreateTombstone,
): Promise<Response> {
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
      path: Api.IMAGE_CREATE_TOMBSTONE,
    },
  });
}


export async function imageInformationExif(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
): Promise<RestResponsesRaw.ImageInformationExif> {
  const query = {
    url: options.url,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_INFORMATION_EXIF,
    },
  });
}


export async function imageManipulationAscii(
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
      path: Api.IMAGE_MANIPULATION_ASCII,
    },
  });
}


export async function imageManipulationBlur(
  context: RequestContext,
  options: RestOptions.ImageManipulationBlur,
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
      path: Api.IMAGE_MANIPULATION_BLUR,
    },
  });
}


export async function imageManipulationBlurple(
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
      path: Api.IMAGE_MANIPULATION_BLURPLE,
    },
  });
}


export async function imageManipulationCircle(
  context: RequestContext,
  options: RestOptions.ImageManipulationCircle,
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
      path: Api.IMAGE_MANIPULATION_CIRCLE,
    },
  });
}


export async function imageManipulationDeepfry(
  context: RequestContext,
  options: RestOptions.ImageManipulationDeepfry,
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
      path: Api.IMAGE_MANIPULATION_DEEPFRY,
    },
  });
}


export async function imageManipulationExplode(
  context: RequestContext,
  options: RestOptions.ImageManipulationExplode,
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
      path: Api.IMAGE_MANIPULATION_EXPLODE,
    },
  });
}


export async function imageManipulationEyes(
  context: RequestContext,
  options: RestOptions.ImageManipulationEyes,
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
      path: Api.IMAGE_MANIPULATION_EYES,
    },
  });
}


export async function imageManipulationFlip(
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
      path: Api.IMAGE_MANIPULATION_FLIP,
    },
  });
}


export async function imageManipulationFlop(
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
      path: Api.IMAGE_MANIPULATION_FLOP,
    },
  });
}


export async function imageManipulationGlitch(
  context: RequestContext,
  options: RestOptions.ImageManipulationGlitch,
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
      path: Api.IMAGE_MANIPULATION_GLITCH,
    },
  });
}


export async function imageManipulationGold(
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
      path: Api.IMAGE_MANIPULATION_GOLD,
    },
  });
}


export async function imageManipulationGrayscale(
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
      path: Api.IMAGE_MANIPULATION_GRAYSCALE,
    },
  });
}


export async function imageManipulationImplode(
  context: RequestContext,
  options: RestOptions.ImageManipulationImplode,
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
      path: Api.IMAGE_MANIPULATION_IMPLODE,
    },
  });
}


export async function imageManipulationInvert(
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
      path: Api.IMAGE_MANIPULATION_INVERT,
    },
  });
}


export async function imageManipulationJPEG(
  context: RequestContext,
  options: RestOptions.ImageManipulationJPEG,
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
      path: Api.IMAGE_MANIPULATION_JPEG,
    },
  });
}


export async function imageManipulationLegofy(
  context: RequestContext,
  options: RestOptions.ImageManipulationLegofy,
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
      path: Api.IMAGE_MANIPULATION_LEGOFY,
    },
  });
}


export async function imageManipulationMagik(
  context: RequestContext,
  options: RestOptions.ImageManipulationMagik,
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
      path: Api.IMAGE_MANIPULATION_MAGIK,
    },
  });
}



export async function imageManipulationMagikGif(
  context: RequestContext,
  options: RestOptions.ImageManipulationMagik,
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
      path: Api.IMAGE_MANIPULATION_MAGIK_GIF,
    },
  });
}


export async function imageManipulationMeme(
  context: RequestContext,
  options: RestOptions.ImageManipulationMeme,
): Promise<Response> {
  const query = {
    bottom: options.bottom,
    font: options.font,
    top: options.top,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_MANIPULATION_MEME,
    },
  });
}


export async function imageManipulationMirrorBottom(
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
      path: Api.IMAGE_MANIPULATION_MIRROR_BOTTOM,
    },
  });
}


export async function imageManipulationMirrorLeft(
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
      path: Api.IMAGE_MANIPULATION_MIRROR_LEFT,
    },
  });
}


export async function imageManipulationMirrorRight(
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
      path: Api.IMAGE_MANIPULATION_MIRROR_RIGHT,
    },
  });
}


export async function imageManipulationMirrorTop(
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
      path: Api.IMAGE_MANIPULATION_MIRROR_TOP,
    },
  });
}


export async function imageManipulationPixelate(
  context: RequestContext,
  options: RestOptions.ImageManipulationPixelate,
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
      path: Api.IMAGE_MANIPULATION_PIXELATE,
    },
  });
}


export async function imageManipulationRain(
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
      path: Api.IMAGE_MANIPULATION_RAIN,
    },
  });
}


export async function imageManipulationRainGold(
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
      path: Api.IMAGE_MANIPULATION_RAIN_GOLD,
    },
  });
}


export async function imageManipulationSharpen(
  context: RequestContext,
  options: RestOptions.ImageManipulationSharpen,
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
      path: Api.IMAGE_MANIPULATION_SHARPEN,
    },
  });
}


export async function imageManipulationSpin(
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
      path: Api.IMAGE_MANIPULATION_SPIN,
    },
  });
}


export async function imageManipulationWall(
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
      path: Api.IMAGE_MANIPULATION_WALL,
    },
  });
}


export async function imageOverlayFlagIsrael(
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
      path: Api.IMAGE_OVERLAY_FLAG_ISRAEL,
    },
  });
}


export async function imageOverlayFlagLGBT(
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
      path: Api.IMAGE_OVERLAY_FLAG_LGBT,
    },
  });
}


export async function imageOverlayFlagNorthKorea(
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
      path: Api.IMAGE_OVERLAY_FLAG_NORTH_KOREA,
    },
  });
}


export async function imageOverlayFlagTrans(
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
      path: Api.IMAGE_OVERLAY_FLAG_TRANS,
    },
  });
}


export async function imageOverlayFlagRussia(
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
      path: Api.IMAGE_OVERLAY_FLAG_RUSSIA,
    },
  });
}


export async function imageOverlayFlagUK(
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
      path: Api.IMAGE_OVERLAY_FLAG_UK,
    },
  });
}


export async function imageOverlayFlagUSA(
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
      path: Api.IMAGE_OVERLAY_FLAG_USA,
    },
  });
}


export async function imageOverlayFlagUSSR(
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
      path: Api.IMAGE_OVERLAY_FLAG_USSR,
    },
  });
}


export async function imageOverlayGoldstar(
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
      path: Api.IMAGE_OVERLAY_GOLDSTAR,
    },
  });
}


export async function imageOverlayHalfLifePistol(
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
      path: Api.IMAGE_OVERLAY_HALF_LIFE_PISTOL,
    },
  });
}


export async function imageOverlayHalfLifeShotgun(
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
      path: Api.IMAGE_OVERLAY_HALF_LIFE_SHOTGUN,
    },
  });
}


export async function imageOverlayHalfLifeSMG(
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
      path: Api.IMAGE_OVERLAY_HALF_LIFE_SMG,
    },
  });
}


export async function imageOverlayShutterstock(
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
      path: Api.IMAGE_OVERLAY_SHUTTERSTOCK,
    },
  });
}


export async function imageToolsBackgroundRemove(
  context: RequestContext,
  options: RestOptions.ImageBackgroundRemoveOptions,
): Promise<Response> {
  const query = {
    model: options.model,
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


export async function imageToolsConvert(
  context: RequestContext,
  options: RestOptions.ImageToolsConvert,
): Promise<Response> {
  const query = {
    size: options.size,
    to: options.to,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_TOOLS_CONVERT,
    },
  });
}


export async function imageToolsCrop(
  context: RequestContext,
  options: RestOptions.ImageToolsCrop,
): Promise<Response> {
  const query = {
    size: options.size,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_TOOLS_CROP,
    },
  });
}


export async function imageToolsGifReverse(
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
      path: Api.IMAGE_TOOLS_GIF_REVERSE,
    },
  });
}


export async function imageToolsGifSeeSaw(
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
      path: Api.IMAGE_TOOLS_GIF_SEE_SAW,
    },
  });
}


export async function imageToolsGifSpeed(
  context: RequestContext,
  options: RestOptions.ImageToolsGifSpeed,
): Promise<Response> {
  const query = {
    loop: options.loop,
    speed: options.speed,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.IMAGE_TOOLS_GIF_SPEED,
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


export async function imageToolsRotate(
  context: RequestContext,
  options: RestOptions.ImageToolsRotate,
): Promise<Response> {
  const query = {
    crop: options.crop,
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


export async function putInfoDiscord(
  context: RequestContext,
  options: RestOptions.PutInfoDiscord,
): Promise<RestResponses.PutInfoDiscord> {
  const body = {
    cluster_id: options.clusterId,
    ram_usage: options.ramUsage,
    shard_count: options.shardCount,
    shards_per_cluster: options.shardsPerCluster,
    shards: options.shards.map((x) => {
      return {
        shard_id: x.shardId,
        status: x.status,

        applications: x.applications,
        channels: x.channels,
        channel_threads: x.channelThreads,
        emojis: x.emojis,
        events: x.events,
        guilds: x.guilds,
        members: x.members,
        member_count: x.memberCount,
        messages: x.messages,
        permission_overwrites: x.permissionOverwrites,
        presences: x.presences,
        presence_activities: x.presenceActivities,
        roles: x.roles,
        stage_instances: x.stageInstances,
        typings: x.typings,
        users: x.users,
        voice_states: x.voiceStates,
      };
    }),
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.INFO_DISCORD,
    },
  });
}


export async function putTag(
  context: RequestContext,
  options: RestOptions.PutTag,
): Promise<RestResponsesRaw.PutTag> {
  const body = {
    content: options.content,
    name: options.name,
    server_id: options.serverId,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.TAGS,
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
    channel_id: options.channelId,
    discriminator: options.discriminator,
    locale: options.locale,
    timezone: options.timezone,
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


export async function search4Chan(
  context: RequestContext,
  options: RestOptions.Search4Chan,
): Promise<RestResponsesRaw.Search4Chan> {
  const query = {
    board: options.board,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_4CHAN,
    },
  });
}


export async function search4ChanRandom(
  context: RequestContext,
  options: RestOptions.Search4ChanRandom,
): Promise<RestResponsesRaw.Search4Chan> {
  const query = {
    nsfw: options.nsfw,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_4CHAN_RANDOM,
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
): Promise<RestResponsesRaw.SearchReddit> {
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


export async function searchSteamEmoji(
  context: RequestContext,
  emoji: string,
): Promise<RestResponsesRaw.SearchSteamEmoji> {
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_STEAM_EMOJIS_EMOJI,
      params: {emoji},
    },
  });
}


export async function searchSteamEmojis(
  context: RequestContext,
  options: RestOptions.SearchSteamEmojis,
): Promise<RestResponsesRaw.SearchSteamEmojis> {
  const query = {
    max_results: options.maxResults,
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_STEAM_EMOJIS,
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
): Promise<RestResponsesRaw.SearchUrbanDictionary> {
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
): Promise<RestResponsesRaw.SearchUrbanDictionary> {
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
) {
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


export async function utilitiesCodeRun(
  context: RequestContext,
  options: RestOptions.UtilitiesCodeRun,
): Promise<RestResponsesRaw.UtilitiesCodeRun> {
  const body = {
    code: options.code,
    input: options.input,
    language: options.language,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_CODE_RUN,
    },
  });
}


export async function utilitiesCodeRunRextester(
  context: RequestContext,
  options: RestOptions.UtilitiesCodeRunRextester,
): Promise<RestResponsesRaw.UtilitiesCodeRunRextester> {
  const body = {
    code: options.code,
    input: options.input,
    language: options.language,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_CODE_RUN_REXTESTER,
    },
  });
}


export async function utilitiesFetchData(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchData,
): Promise<Response> {
  const query = {
    max_file_size: options.maxFileSize,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_FETCH_DATA,
    },
  });
}


export async function utilitiesFetchImage(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchImage,
): Promise<Response> {
  const query = {
    max_file_size: options.maxFileSize,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_FETCH_IMAGE,
    },
  });
}


export async function utilitiesFetchMedia(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchMedia,
): Promise<Response> {
  const query = {
    max_file_size: options.maxFileSize,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_FETCH_MEDIA,
    },
  });
}


export async function utilitiesFetchText(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchText,
): Promise<Response> {
  const query = {
    max_file_size: options.maxFileSize,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_FETCH_TEXT,
    },
  });
}


export async function utilitiesImagescriptV1(
  context: RequestContext,
  options: RestOptions.UtilitiesImagescriptV1,
): Promise<Response> {
  const body = {
    code: options.code,
  };
  return request(context, {
    dataOnly: false,
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_IMAGESCRIPT_V1,
    },
  });
}


export async function utilitiesQrCreate(
  context: RequestContext,
  options: RestOptions.UtilitiesQrCreate,
): Promise<Response> {
  const query = {
    margin: options.margin,
    query: options.query,
    size: options.size,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_QR_CREATE,
    },
  });
}


export async function utilitiesQrScan(
  context: RequestContext,
  options: RestOptions.UtilitiesQrScan,
): Promise<RestResponsesRaw.UtilitiesQrScan> {
  const query = {
    url: options.url,
  };
  const response = await request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_QR_SCAN,
    },
  });
  return {
    scanned: await response.json(),
    url: response.headers.get('x-unfurled-url'),
  };
}


export async function utilitiesScreenshot(
  context: RequestContext,
  options: RestOptions.UtilitiesScreenshot,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_SCREENSHOT,
    },
  });
}


export async function videoToolsConvert(
  context: RequestContext,
  options: RestOptions.VideoToolsConvertOptions,
): Promise<Response> {
  const query = {
    remove_audio: options.removeAudio,
    to: options.to,
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.VIDEO_TOOLS_CONVERT,
    },
  });
}


export async function videoToolsExtractAudio(
  context: RequestContext,
  options: RestOptions.VideoBaseOptions,
): Promise<Response> {
  const query = {
    url: options.url,
  };
  return request(context, {
    dataOnly: false,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.VIDEO_TOOLS_EXTRACT_AUDIO,
    },
  });
}
