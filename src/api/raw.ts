import { ShardClient, Structures } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { RequestTypes } from 'detritus-client-rest';
import { RequestFile, Response, createHeaders } from 'detritus-rest';
import { HTTPMethods } from 'detritus-rest/lib/constants';

import { Api, Domains } from './endpoints';
import { RestOptions, RestResponsesRaw, RestResponses } from './types';

import {
  GoogleLocales,
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildCommandsAllowlistTypes,
  GuildCommandsBlocklistTypes,
  NotSoHeaders,
} from '../constants';
import { createColorUrl } from '../utils';



export interface RequestContext {
  channelId?: string,
  client: ShardClient,
  guild?: Structures.Guild | null,
  guildId?: string,
  hasServerPermissions?: boolean,
  inDm?: boolean,
  user?: Structures.User,
}

export interface RequestOptions extends RequestTypes.Options {
  file?: RequestFile,
}


const HOST = Api.URL_PUBLIC.split('/').pop()!;

export async function request(
  context: RequestContext,
  options: RequestOptions,
): Promise<any> {
  options.url = Api.URL + Api.PATH;
  options.headers = createHeaders(options.headers);

  if ((Api.URL as string) === (Domains.LOCALHOST as string)) {
    options.headers.set('host', HOST);
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
      channel_id: (context.inDm && context.hasServerPermissions) ? context.channelId : undefined,
      bot: user.bot,
      id: user.id,
      username: user.username,
    });
    options.headers.set(NotSoHeaders.USER, Buffer.from(bareUser).toString('base64'));
  }

  if (options.file) {
    if (options.files) {
      options.files.unshift(options.file);
    } else {
      options.files = [options.file];
    }
  }

  return client.rest.request(options);
}


function getDefaultMaxFileSize(
  context: RequestContext,
  options?: {maxFileSize?: number} | Record<string, any>,
): number {
  if (options && options.maxFileSize !== undefined) {
    return options.maxFileSize;
  }
  return (context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE;
}


export async function addGuildFeature(
  context: RequestContext,
  guildId: string,
  feature: string,
): Promise<RestResponsesRaw.AddGuildFeature> {
  const body = {
    feature,
  };
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD_FEATURES,
      params,
    },
  });
}


export async function audioToolsPutConcat(
  context: RequestContext,
  options: RestOptions.MediaAToolsPutBase,
): Promise<RestResponsesRaw.FileResponse> {
  const body = {
    longest: options.longest,
    loop: !options.noloop,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_A_TOOLS_PUT_CONCAT,
    },
  });
}


export async function audioToolsPutMix(
  context: RequestContext,
  options: RestOptions.MediaAToolsPutBase,
): Promise<RestResponsesRaw.FileResponse> {
  const body = {
    longest: options.longest,
    loop: !options.noloop,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_A_TOOLS_PUT_MIX,
    },
  });
}


export async function audioToolsPutReplace(
  context: RequestContext,
  options: RestOptions.MediaAToolsPutBase,
): Promise<RestResponsesRaw.FileResponse> {
  const body = {
    longest: options.longest,
    loop: !options.noloop,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_A_TOOLS_PUT_REPLACE,
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


export async function createGuildCommandsAllowlist(
  context: RequestContext,
  guildId: string,
  command: string,
  allowlistId: string,
  type: GuildCommandsAllowlistTypes,
): Promise<RestResponsesRaw.CreateGuildCommandsAllowlist> {
  return request(context, {
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD_COMMANDS_ALLOWLIST,
      params: {allowlistId, command, guildId, type},
    },
  });
}


export async function createGuildCommandsBlocklist(
  context: RequestContext,
  guildId: string,
  command: string,
  blocklistId: string,
  type: GuildCommandsBlocklistTypes,
): Promise<RestResponsesRaw.CreateGuildCommandsBlocklist> {
  return request(context, {
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD_COMMANDS_BLOCKLIST,
      params: {command, blocklistId, guildId, type},
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
    server_id: options.serverId,
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
    command_type: options.commandType,
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
      path: Api.USER_USAGE_COMMAND,
      params,
    },
  });
}


export async function createVoiceClone(
  context: RequestContext,
  options: RestOptions.CreateVoiceClone,
): Promise<RestResponsesRaw.CreateVoiceClone> {
  const body = {
    name: options.name,
    url: options.url,
  };
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.VOICE_CLONE,
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


export async function deleteGuildCommandsAllowlist(
  context: RequestContext,
  guildId: string,
  command: string,
  allowlistId: string,
  type: GuildCommandsAllowlistTypes,
): Promise<RestResponsesRaw.DeleteGuildCommandsAllowlist> {
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.GUILD_COMMANDS_ALLOWLIST,
      params: {allowlistId, command, guildId, type},
    },
  });
}


export async function deleteGuildCommandsBlocklist(
  context: RequestContext,
  guildId: string,
  command: string,
  blocklistId: string,
  type: GuildCommandsBlocklistTypes,
): Promise<RestResponsesRaw.DeleteGuildCommandsBlocklist> {
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.GUILD_COMMANDS_BLOCKLIST,
      params: {blocklistId, command, guildId, type},
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


export async function deleteReminderPositional(
  context: RequestContext,
  userId: string,
  position: number | string,
): Promise<RestResponsesRaw.DeleteReminder> {
  const params = {userId, position};
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.REMINDER_POSITIONAL,
      params,
    },
  });
}

// rename
export async function deleteTag(
  context: RequestContext,
  options: RestOptions.DeleteTagSearch,
): Promise<RestResponsesRaw.DeleteTagSearch> {
  const query = {
    name: options.name,
    server_id: options.serverId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.DELETE,
      path: Api.TAGS_SEARCH,
    },
  });
}

// rename
export async function deleteTagsServer(
  context: RequestContext,
  serverId: string,
  options: RestOptions.DeleteTags = {},
): Promise<{count: number}> {
  const query = {
    content: options.content,
    name: options.name,
    server_id: serverId,
    user_id: options.userId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.TAGS_DELETE,
    },
  });
}


export async function deleteTagVariable(
  context: RequestContext,
  tagId: string,
  storageType: number,
  storageId: string,
  options: RestOptions.DeleteTagVariable,
): Promise<RestResponsesRaw.DeleteTagVariable> {
  const params = {tagId, storageType, storageId};
  const query = {
    name: options.name,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.DELETE,
      path: Api.TAG_VARIABLE,
      params,
    },
  });
}


export async function deleteVoice(
  context: RequestContext,
  voiceId: string,
): Promise<RestResponses.DeleteVoice> {
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.VOICE,
      params: {voiceId},
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
    blocked_reason: options.blockedReason,
    blocklist: options.blocklist,
    commands_allowlist: options.commandsAllowlist,
    commands_blocklist: options.commandsBlocklist,
    ml_diffusion_model: options.mlDiffusionModel,
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


export async function editTag(
  context: RequestContext,
  tagId: string,
  options: RestOptions.EditTag,
): Promise<RestResponsesRaw.EditTag> {
  const body = {
    content: options.content,
    is_command: options.isCommand,
    is_url_refresh: options.isUrlRefresh,
    name: options.name,
    reference_tag_id: options.referenceTagId,
  };
  const params = {tagId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PATCH,
      path: Api.TAG,
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
    blocked_reason: options.blockedReason,
    channel_id: options.channelId,
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


export async function editUserSettings(
  context: RequestContext,
  userId: string,
  options: RestOptions.EditUserSettings,
): Promise<RestResponsesRaw.EditUserSettings> {
  const body = {
    fallbacks_media_image: options.fallbacksMediaImage,
    file_upload_threshold: options.fileUploadThreshold,
    locale: options.locale,
    ml_diffusion_model: options.mlDiffusionModel,
    opt_out_content: options.optOutContent,
    timezone: options.timezone,
    tts_voice: options.ttsVoice,
    vanity: options.vanity,
  };
  const params = {userId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PATCH,
      path: Api.USER_SETTINGS,
      params,
    },
  });
}


export async function fetchCommandsUsage(
  context: RequestContext,
  options: RestOptions.FetchCommandsUsage = {},
): Promise<RestResponsesRaw.FetchCommandsUsage> {
  const query = {
    after: options.after,
    before: options.before,
    channel_id: options.channelId,
    command_id: options.commandId,
    command_type: options.commandType,
    guild_id: options.guildId,
    limit: options.limit,
    user_id: options.userId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.COMMANDS_USAGE,
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


export async function fetchGuildTagsCommands(
  context: RequestContext,
  guildId: string,
): Promise<RestResponsesRaw.FetchGuildTagsCommands> {
  const params = {guildId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.GUILD_TAGS_COMMANDS,
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
    user_id: options.userId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.REMINDERS,
    },
  });
}


export async function fetchReminderPositional(
  context: RequestContext,
  userId: string,
  position: number | string,
): Promise<RestResponsesRaw.FetchReminderPositional> {
  const params = {userId, position};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.REMINDER_POSITIONAL,
      params,
    },
  });
}


// rename
export async function fetchTag(
  context: RequestContext,
  options: RestOptions.FetchTagSearch,
): Promise<RestResponsesRaw.FetchTagSearch> {
  const query = {
    name: options.name,
    server_id: options.serverId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAGS_SEARCH,
    },
  });
}


export async function fetchTagId(
  context: RequestContext,
  tagId: string,
): Promise<RestResponsesRaw.FetchTagId> {
  const params = {tagId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.TAG,
      params,
    },
  });
}


// rename
export async function fetchTagRandom(
  context: RequestContext,
  options: RestOptions.FetchTagSearchRandom = {},
): Promise<RestResponsesRaw.FetchTagSearchRandom> {
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
      path: Api.TAGS_SEARCH_RANDOM,
    },
  });
}


// rename
export async function fetchTagsServer(
  context: RequestContext,
  serverId: string,
  options: RestOptions.FetchTags = {},
): Promise<RestResponsesRaw.FetchTags> {
  const query = {
    after: options.after,
    before: options.before,
    content: options.content,
    limit: options.limit,
    name: options.name,
    server_id: serverId,
    user_id: options.userId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAGS,
    },
  });
}


export async function fetchTagVariable(
  context: RequestContext,
  tagId: string,
  storageType: number,
  storageId: string,
  options: RestOptions.FetchTagVariable,
): Promise<RestResponsesRaw.FetchTagVariable> {
  const params = {tagId, storageType, storageId};
  const query = {
    name: options.name,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAG_VARIABLE,
      params,
    },
  });
}


export async function fetchTagVariables(
  context: RequestContext,
  tagId: string,
  options: RestOptions.FetchTagVariables,
): Promise<RestResponsesRaw.FetchTagVariables> {
  const params = {tagId};
  const query = {
    channel_id: options.channelId,
    guild_id: options.guildId,
    user_id: options.userId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAG_VARIABLES,
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


export async function fetchUserReminders(
  context: RequestContext,
  userId: string,
  options: RestOptions.FetchUserReminders = {},
): Promise<RestResponsesRaw.FetchReminders> {
  const params = {userId};
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
      path: Api.USER_REMINDERS,
      params,
    },
  });
}


export async function fetchUserSettings(
  context: RequestContext,
  userId: string,
): Promise<RestResponsesRaw.FetchUserSettings> {
  const params = {userId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.USER_SETTINGS,
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


export async function fetchUserTagsCommands(
  context: RequestContext,
  userId: string,
): Promise<RestResponsesRaw.FetchUserTagsCommands> {
  const params = {userId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.USER_TAGS_COMMANDS,
      params,
    },
  });
}


export async function fetchUserVoices(
  context: RequestContext,
  userId: string,
): Promise<RestResponsesRaw.FetchUserVoices> {
  const params = {userId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.USER_VOICES,
      params,
    },
  });
}


export async function funASCII(
  context: RequestContext,
  options: RestOptions.FunASCII,
): Promise<RestResponsesRaw.FileResponse> {
  const body = {
    text: options.text,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.FUN_ASCII,
    },
  });
}


export async function funTextToSpeech(
  context: RequestContext,
  options: RestOptions.FunTextToSpeech,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    text: options.text,
    voice: options.voice,
    voice_id: options.voiceId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.FUN_TEXT_TO_SPEECH,
    },
  });
}


export async function generateTag(
  context: RequestContext,
  options: RestOptions.GenerateTag,
): Promise<RestResponsesRaw.GenerateTag> {
  const body = {
    model: options.model,
    prompt: options.prompt,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.TAGS_GENERATE,
    },
  });
}


export async function googleContentVisionLabels(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionBase,
): Promise<RestResponsesRaw.GoogleContentVisionLabels> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
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
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
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
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
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
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
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
    from_language: options.from,
    text: options.text,
    to_language: options.to,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.GOOGLE_TRANSLATE,
    },
  });
}


export async function mediaAIVManipulationADHD(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationADHD,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    horizontal: options.horizontal,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_ADHD,
    },
  });
}


export async function mediaAIVManipulationFadeIn(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationFadeIn,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    color: options.color,
    duration: options.duration,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_FADE_IN,
    },
  });
}


export async function mediaAIVManipulationFadeOut(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationFadeOut,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    color: options.color,
    duration: options.duration,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_FADE_OUT,
    },
  });
}


export async function mediaAIVToolsConcat(
  context: RequestContext,
  options: RestOptions.MediaBaseOptionsMultiple,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_CONCAT,
    },
  });
}


export async function mediaAIVToolsConvert(
  context: RequestContext,
  options: RestOptions.MediaAIVToolsConvert,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    remove_audio: options.removeAudio,
    to: options.to,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_CONVERT,
    },
  });
}


export async function mediaAIVToolsExif(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.MediaAIVToolsExif> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_EXIF,
    },
  });
}


export async function mediaAIVToolsJoin(
  context: RequestContext,
  options: RestOptions.MediaAIVToolsJoin,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    loop: !options.noloop,
    max_file_size: maxFileSize,
    no_resize: options.noresize,
    urls: options.urls,
    vertical: options.vertical,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_JOIN,
    },
  });
}


export async function mediaAIVToolsOverlay(
  context: RequestContext,
  options: RestOptions.MediaAIVToolsOverlay,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    blend: options.blend,
    color: options.color,
    loop: !options.noloop,
    max_file_size: maxFileSize,
    opacity: options.opacity,
    resize: options.resize,
    similarity: options.similarity,
    urls: options.urls,
    x: options.x,
    y: options.y,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_OVERLAY,
    },
  });
}


export async function mediaAIVToolsReverse(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_REVERSE,
    },
  });
}


export async function mediaAIVToolsSeeSaw(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_SEE_SAW,
    },
  });
}


export async function mediaAIVToolsSnip(
  context: RequestContext,
  options: RestOptions.MediaAIVToolsSnip,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    audio_only: options.audioOnly,
    end: options.end,
    max_file_size: maxFileSize,
    start: options.start,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_SNIP,
    },
  });
}

export async function mediaAIVToolsSpeed(
  context: RequestContext,
  options: RestOptions.MediaIVToolsSpeed,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    loop: options.loop,
    max_file_size: maxFileSize,
    speed: options.speed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_SPEED,
    },
  });
}


export async function mediaAVManipulationAudioChannelsCombine(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_CHANNELS_COMBINE,
    },
  });
}


export async function mediaAVManipulationAudioPitch(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioPitch,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_PITCH,
    },
  });
}


export async function mediaAVManipulationAudioVibrato(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioVibrato,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    depth: options.depth,
    frequency: options.frequency,
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_VIBRATO,
    },
  });
}


export async function mediaAVManipulationBoostBass(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_BOOST_BASS,
    },
  });
}


export async function mediaAVManipulationCompress(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationCompress,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    no_revert: options.norevert,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_COMPRESS,
    },
  });
}


export async function mediaAVManipulationDestroy(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_DESTROY,
    },
  });
}


export async function mediaAVManipulationVolume(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationVolume,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    url: options.url,
    volume: options.volume,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_VOLUME,
    },
  });
}


export async function mediaAVToolsExtractAudio(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_TOOLS_EXTRACT_AUDIO,
    },
  });
}


export async function mediaAVToolsIdentify(
  context: RequestContext,
  options: RestOptions.MediaAVToolsIdentify,
): Promise<RestResponsesRaw.MediaAVToolsIdentify> {
  const query = {
    start: options.start,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_TOOLS_IDENTIFY,
    },
  });
}


export async function mediaAVToolsTranscribe(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.MediaAVToolsTranscribe> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_TOOLS_TRANSCRIBE,
    },
  });
}


export async function mediaICreateRetrowave(
  context: RequestContext,
  options: RestOptions.MediaICreateRetrowave,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    background: options.background,
    line_1: options.line1,
    line_2: options.line2,
    line_3: options.line3,
    text_style: options.textStyle,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_CREATE_RETROWAVE,
    },
  });
}


export async function mediaICreateTombstone(
  context: RequestContext,
  options: RestOptions.MediaICreateTombstone,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    line_1: options.line1,
    line_2: options.line2,
    line_3: options.line3,
    line_4: options.line4,
    line_5: options.line5,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_CREATE_TOMBSTONE,
    },
  });
}


export async function mediaICreateWordcloud(
  context: RequestContext,
  options: RestOptions.MediaICreateWordcloud,
): Promise<RestResponsesRaw.FileResponse> {
  const body = {
    words: options.words,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_CREATE_WORDCLOUD,
    },
  });
}


export async function mediaIVManipulationAscii(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_ASCII,
    },
  });
}


export async function mediaIVManipulationBlur(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationBlur,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_BLUR,
    },
  });
}


export async function mediaIVManipulationBlurple(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_BLURPLE,
    },
  });
}


export async function mediaIVManipulationCaption(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCaption,
): Promise<RestResponsesRaw.FileResponse> {
  const body = {
    font: options.font,
    text: options.text,
    url: options.url,
  };
  return request(context, {
    body,
    file: options.file,
    multipart: true,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CAPTION,
    },
  });
}


export async function mediaIVManipulationCircle(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCircle,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CIRCLE,
    },
  });
}


export async function mediaIVManipulationDeepfry(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDeepfry,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_DEEPFRY,
    },
  });
}


export async function mediaIVManipulationExplode(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationExplode,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_EXPLODE,
    },
  });
}


export async function mediaIVManipulationEyes(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEyes,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    type: options.type,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_EYES,
    },
  });
}


export async function mediaIVManipulationFlip(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_FLIP,
    },
  });
}


export async function mediaIVManipulationFlop(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_FLOP,
    },
  });
}


export async function mediaIVManipulationGlitch(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlitch,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    amount: options.amount,
    iterations: options.iterations,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GLITCH,
    },
  });
}


export async function mediaIVManipulationGlitchAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlitch,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    amount: options.amount,
    iterations: options.iterations,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GLITCH_ANIMATED,
    },
  });
}


export async function mediaIVManipulationGlobe(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GLOBE,
    },
  });
}


export async function mediaIVManipulationGold(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GOLD,
    },
  });
}


export async function mediaIVManipulationGrayscale(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GRAYSCALE,
    },
  });
}


export async function mediaIVManipulationHueShiftHSV(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftHSV,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    brightness: options.brightness,
    hue: options.hue,
    saturation: options.saturation,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_HUE_SHIFT_HSV,
    },
  });
}


export async function mediaIVManipulationHueShiftRGB(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftRGB,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    blue: options.blue,
    green: options.green,
    red: options.red,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_HUE_SHIFT_RGB,
    },
  });
}


export async function mediaIVManipulationImplode(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationImplode,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_IMPLODE,
    },
  });
}


export async function mediaIVManipulationInvert(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_INVERT,
    },
  });
}


export async function mediaIVManipulationInvertRGBA(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationInvertRGBA,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    alpha: options.alpha,
    blue: options.blue,
    green: options.green,
    red: options.red,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_INVERT_RGBA,
    },
  });
}


export async function mediaIVManipulationJPEG(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationJPEG,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    quality: options.quality,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_JPEG,
    },
  });
}


export async function mediaIVManipulationLabelsIFunny(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LABELS_IFUNNY,
    },
  });
}


export async function mediaIVManipulationLegofy(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationLegofy,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    dither: options.dither,
    palette: options.palette,
    size: options.size,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LEGOFY,
    },
  });
}


export async function mediaIVManipulationMagik(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMagik,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MAGIK,
    },
  });
}



export async function mediaIVManipulationMagikAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMagik,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MAGIK_ANIMATED,
    },
  });
}


export async function mediaIVManipulationMeme(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMeme,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    bottom: options.bottom,
    font: options.font,
    top: options.top,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MEME,
    },
  });
}


export async function mediaIVManipulationMirrorBottom(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MIRROR_BOTTOM,
    },
  });
}


export async function mediaIVManipulationMirrorLeft(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MIRROR_LEFT,
    },
  });
}


export async function mediaIVManipulationMirrorRight(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MIRROR_RIGHT,
    },
  });
}


export async function mediaIVManipulationMirrorTop(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MIRROR_TOP,
    },
  });
}


export async function mediaIVManipulationOverlayFace(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayFace,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    scale: options.scale,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FACE,
    },
  });
}


export async function mediaIVManipulationOverlayFlagIsrael(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FLAG_ISRAEL,
    },
  });
}


export async function mediaIVManipulationOverlayFlagLGBT(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FLAG_LGBT,
    },
  });
}


export async function mediaIVManipulationOverlayFlagNorthKorea(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FLAG_NORTH_KOREA,
    },
  });
}


export async function mediaIVManipulationOverlayFlagTrans(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FLAG_TRANS,
    },
  });
}


export async function mediaIVManipulationOverlayFlagRussia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FLAG_RUSSIA,
    },
  });
}


export async function mediaIVManipulationOverlayFlagUK(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FLAG_UK,
    },
  });
}


export async function mediaIVManipulationOverlayFlagUSA(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FLAG_USA,
    },
  });
}


export async function mediaIVManipulationOverlayFlagUSSR(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FLAG_USSR,
    },
  });
}


export async function mediaIVManipulationOverlayFlies(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayFlies,
): Promise<RestResponsesRaw.FileResponse> {
  const body = {
    amount: options.amount,
    degrees: options.degrees,
    speed: options.speed,
    urls: [options.url, options.flyImage].filter(Boolean),
  };
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_FLIES,
    },
  });
}


export async function mediaIVManipulationOverlayGoldstar(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_GOLDSTAR,
    },
  });
}


export async function mediaIVManipulationOverlayHalfLifePistol(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_HALF_LIFE_PISTOL,
    },
  });
}


export async function mediaIVManipulationOverlayHalfLifeShotgun(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_HALF_LIFE_SHOTGUN,
    },
  });
}


export async function mediaIVManipulationOverlayHalfLifeSMG(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_HALF_LIFE_SMG,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsBernie1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_BERNIE_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsBobRoss(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_BOB_ROSS,
    },
  });
}



export async function mediaIVManipulationOverlayPersonsGaben1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_GABEN_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsLTTLinus1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_LTT_LINUS_1,
    },
  });
}


export async function mediaIVManipulationOverlayShutterstock(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_SHUTTERSTOCK,
    },
  });
}


export async function mediaIVManipulationOverlayStarman(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_STARMAN,
    },
  });
}


export async function mediaIVManipulationPaper(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_PAPER,
    },
  });
}


export async function mediaIVManipulationPix2Pix(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPix2Pix,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    model: options.model,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_PIX2PIX,
    },
  });
}


export async function mediaIVManipulationPixelate(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPixelate,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    pixel_width: options.pixelWidth,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_PIXELATE,
    },
  });
}


export async function mediaIVManipulationRain(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_RAIN,
    },
  });
}


export async function mediaIVManipulationRainGold(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_RAIN_GOLD,
    },
  });
}


export async function mediaIVManipulationRecolor(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_RECOLOR,
    },
  });
}


export async function mediaIVManipulationShake(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationShake,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    horizontal: options.horizontal,
    randomize: options.randomize,
    url: options.url,
    vertical: options.vertical,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SHAKE,
    },
  });
}


export async function mediaIVManipulationSharpen(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSharpen,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SHARPEN,
    },
  });
}


export async function mediaIVManipulationSpin(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSpin,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    circle: options.circle,
    clockwise: options.clockwise,
    crop: options.crop,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SPIN,
    },
  });
}


export async function mediaIVManipulationSwapColors(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SWAP_COLORS,
    },
  });
}


export async function mediaIVManipulationSwapPixels(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SWAP_PIXELS,
    },
  });
}


export async function mediaIVManipulationSwapRGBA(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSwapRGBA,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    channels: options.channels,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SWAP_RGBA,
    },
  });
}


export async function mediaIVManipulationSwirl(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSwirl,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    degrees: options.degrees,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SWIRL,
    },
  });
}


export async function mediaIVManipulationTrace(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_TRACE,
    },
  });
}


export async function mediaIVManipulationUncaption(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_UNCAPTION,
    },
  });
}


export async function mediaIVManipulationVaporwave(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationVaporwave,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    text: options.text,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_VAPORWAVE,
    },
  });
}


export async function mediaIVManipulationWall(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_WALL,
    },
  });
}


export async function mediaIVManipulationWave(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWave,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    amplitude: options.amplitude,
    url: options.url,
    wave_length: options.waveLength,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_WAVE,
    },
  });
}


export async function mediaIVManipulationWaveAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWaveAnimated,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    amplitude: options.amplitude,
    speed: options.speed,
    url: options.url,
    wave_length: options.waveLength,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_WAVE_ANIMATED,
    },
  });
}


export async function mediaIVToolsBackgroundRemove(
  context: RequestContext,
  options: RestOptions.MediaIVToolsBackgroundRemoveOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    model: options.model,
    trim: options.trim,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_TOOLS_BACKGROUND_REMOVE,
    },
  });
}


export async function mediaIVToolsCrop(
  context: RequestContext,
  options: RestOptions.MediaIVToolsCrop,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    height: options.height,
    width: options.width,
    x: options.x,
    y: options.y,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_TOOLS_CROP,
    },
  });
}


export async function mediaIVToolsCropAuto(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_TOOLS_CROP_AUTO,
    },
  });
}


export async function mediaIVToolsCropCircle(
  context: RequestContext,
  options: RestOptions.MediaIVToolsCropCircle,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    background: options.background,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_TOOLS_CROP_CIRCLE,
    },
  });
}


export async function mediaIVToolsCropTwitterHex(
  context: RequestContext,
  options: RestOptions.MediaIVToolsCropTwitterHex,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    background: options.background,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_TOOLS_CROP_TWITTER_HEX,
    },
  });
}


export async function mediaIVToolsObjectRemove(
  context: RequestContext,
  options: RestOptions.MediaIVToolsObjectRemoveOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    label: options.object,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_TOOLS_OBJECT_REMOVE,
    },
  });
}


export async function mediaIVToolsResize(
  context: RequestContext,
  options: RestOptions.MediaIVToolsResize,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    convert: options.convert,
    ratio: options.ratio,
    scale: options.scale,
    size: options.size,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_TOOLS_RESIZE,
    },
  });
}


export async function mediaIVToolsRotate(
  context: RequestContext,
  options: RestOptions.MediaIVToolsRotate,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    crop: options.crop,
    degrees: options.degrees,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_TOOLS_ROTATE,
    },
  });
}


export async function mediaIVToolsTrim(
  context: RequestContext,
  options: RestOptions.MediaIVToolsTrim,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    margin: options.margin,
    threshold: options.threshold,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_TOOLS_TRIM,
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
        guild_scheduled_events: x.guildScheduledEvents,
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
    reference_tag_id: options.referenceTagId,
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


export async function putTagVariable(
  context: RequestContext,
  tagId: string,
  storageType: number,
  storageId: string,
  options: RestOptions.PutTagVariable,
): Promise<RestResponsesRaw.PutTagVariable> {
  const body = {
    name: options.name,
    value: options.value,
  };
  const params = {tagId, storageType, storageId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.TAG_VARIABLE,
      params,
    },
  });
}


export async function putTagVariables(
  context: RequestContext,
  tagId: string,
  options: RestOptions.PutTagVariables,
): Promise<RestResponsesRaw.PutTagVariables> {
  const body = {
    channel_id: options.channelId,
    guild_id: options.guildId,
    user_id: options.userId,
    variables: options.variables.map((x) => {
      return {
        name: x.name,
        storage_id: x.storageId,
        storage_type: x.storageType,
        value: x.value,
      };
    }),
  };
  const params = {tagId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.TAG_VARIABLES,
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
    blocked: options.blocked,
    blocked_reason: options.blockedReason,
    channel_id: options.channelId,
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


export async function removeGuildFeature(
  context: RequestContext,
  guildId: string,
  feature: string,
): Promise<RestResponsesRaw.RemoveGuildFeature> {
  const body = {
    feature,
  };
  const params = {guildId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.GUILD_FEATURES_REMOVE,
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
    safe: options.safe,
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


export async function searchImgur(
  context: RequestContext,
  options: RestOptions.SearchImgur,
): Promise<RestResponsesRaw.SearchImgur> {
  const query = {
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.SEARCH_IMGUR,
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
    language: options.language,
    stdin: options.stdin,
    urls: options.urls,
    version: options.version,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_CODE_RUN,
    },
  });
}


export async function utilitiesFetchData(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchData,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
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
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
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
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
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
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
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
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    code: options.code,
    max_file_size: maxFileSize,
    ml_diffusion_model: options.mlDiffusionModel,
    upload: options.upload,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_IMAGESCRIPT_V1,
    },
  });
}


export async function utilitiesMLEdit(
  context: RequestContext,
  options: RestOptions.UtilitiesMLEdit,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    do_not_error: options.doNotError,
    model: options.model,
    query: options.query,
    safe: options.safe,
    seed: options.seed,
    steps: options.steps,
    strength: options.strength,
    upload: options.upload,
    url: options.url,
  };
  const response = await request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_ML_EDIT,
    },
  });
  if (options.safe && response.file.has_nsfw) {
    if (options.doNotError) {
      return await utilitiesFetchMedia(context, {
        url: createColorUrl(0, 512, 512),
      });
    }
    throw new Error('Generated Media may contain NSFW content');
  }
  return response;
}


export async function utilitiesMLImagine(
  context: RequestContext,
  options: RestOptions.UtilitiesMLImagine,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    do_not_error: options.doNotError,
    model: options.model,
    query: options.query,
    safe: options.safe,
    seed: options.seed,
    steps: options.steps,
    upload: options.upload,
  };
  const response = await request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_ML_IMAGINE,
    },
  });
  if (options.safe && response.file.has_nsfw) {
    if (options.doNotError) {
      return await utilitiesFetchMedia(context, {
        url: createColorUrl(0, 512, 512),
      });
    }
    throw new Error('Generated Media may contain NSFW content');
  }
  return response;
}


export async function utilitiesMLInterrogate(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.UtilitiesMLInterrogate> {
  const query = {
    url: options.url,
  };
  return request(context, {
    file: options.file,
    multipart: true,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_ML_INTERROGATE,
    },
  });
}


export async function utilitiesQrCreate(
  context: RequestContext,
  options: RestOptions.UtilitiesQrCreate,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    margin: options.margin,
    query: options.query,
    size: options.size,
  };
  return request(context, {
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
    ...(await response.json()),
    url: response.headers.get('x-unfurled-url'),
  };
}


export async function utilitiesScreenshot(
  context: RequestContext,
  options: RestOptions.UtilitiesScreenshot,
): Promise<RestResponsesRaw.FileResponse> {
  const query = {
    safe: options.safe,
    timeout: options.timeout,
    url: options.url,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_SCREENSHOT,
    },
  });
}


export async function voiceCloneAdd(
  context: RequestContext,
  voiceId: string,
  options: RestOptions.VoiceCloneAdd,
): Promise<RestResponsesRaw.VoiceCloneAdd> {
  const body = {
    url: options.url,
  };
  const params = {voiceId};
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.VOICE_ADD,
      params,
    },
  });
}


export async function voiceCloneEdit(
  context: RequestContext,
  voiceId: string,
  options: RestOptions.VoiceCloneEdit,
): Promise<RestResponsesRaw.VoiceCloneEdit> {
  const body = {
    name: options.name,
  };
  const params = {voiceId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PATCH,
      path: Api.VOICE,
      params,
    },
  });
}
