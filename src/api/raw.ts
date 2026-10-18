import { Command, Interaction, ShardClient, Structures } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { RequestTypes } from 'detritus-client-rest';
import { RequestFile, Response, createHeaders } from 'detritus-rest';
import { HTTPMethods } from 'detritus-rest/lib/constants';

import { Api, Domains } from './endpoints';
import { IS_NOTSOBOT_API_ERROR } from './errors';
import { recordApiRequest } from '../metrics';
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
  channel?: Structures.Channel | null,
  channelId?: string,
  client: ShardClient,
  guild?: Structures.Guild | null,
  guildId?: string,
  isBotPresent?: boolean,
  inDm?: boolean,
  interaction?: Structures.Interaction,
  maxAttachmentSize?: number,
  metadata?: Record<string, any> | null,
  user?: Structures.User,
}

export interface RequestOptions extends RequestTypes.Options {
  file?: RequestFile,
}


const HOST = Api.URL_PUBLIC.split('/').pop()!;

export async function request(
  context: RequestContext | Interaction.InteractionContext | Command.Context,
  options: RequestOptions,
): Promise<any> {
  // shallow copy so the caller's options object can be reused/retried safely
  options = Object.assign({}, options);
  options.url = Api.URL + Api.PATH;
  options.headers = createHeaders(options.headers);

  if ((Api.URL as string) === (Domains.LOCALHOST as string)) {
    options.headers.set('host', HOST);
  }

  const token = process.env.NOTSOBOT_API_TOKEN;
  if (token) {
    options.headers.set(NotSoHeaders.AUTHORIZATION, `Bot ${token}`);
  }

  const { channel, channelId, client, guild, guildId, metadata, user } = context;
  if (channelId) {
    options.headers.set(NotSoHeaders.CHANNEL_ID, channelId);
  }
  if (guildId) {
    options.headers.set(NotSoHeaders.GUILD_ID, guildId);
  }

  if (guildId || channelId) {
    options.headers.set(NotSoHeaders.SERVER_ID, (guildId || channelId)!);
  }

  if (guild) {
    options.headers.set(NotSoHeaders.SERVER_OWNER_ID, guild.ownerId);
  } else if (channel && channel.ownerId) {
    const server = JSON.stringify(channel);
    options.headers.set(NotSoHeaders.SERVER, Buffer.from(server).toString('base64'));
    options.headers.set(NotSoHeaders.SERVER_ID, channel.id);
    options.headers.set(NotSoHeaders.SERVER_OWNER_ID, channel.ownerId);
  }

  if (user) {
    options.headers.set(NotSoHeaders.USER_ID, user.id);
    const bareUser = JSON.stringify({
      avatar: user.avatar,
      discriminator: user.discriminator,
      channel_id: (context.inDm && context.isBotPresent) ? context.channelId : undefined,
      bot: user.bot,
      id: user.id,
      username: user.username,
    });
    options.headers.set(NotSoHeaders.USER, Buffer.from(bareUser).toString('base64'));
  }

  if ('interaction' in context) {
    const { interaction } = context;
    if (interaction && interaction.entitlements && interaction.entitlements.length) {
      const entitlements = JSON.stringify(interaction.entitlements);
      options.headers.set(NotSoHeaders.ENTITLEMENTS, Buffer.from(entitlements).toString('base64'));
    }
  }

  if (metadata && metadata.tag) {
    const tagId = (metadata.tag.reference_tag) ? metadata.tag.reference_tag.id : metadata.tag.id;
    options.headers.set(NotSoHeaders.TAG_ID, tagId);
  }

  if (context instanceof Interaction.InteractionContext) {
    const metadata = context.invoker.metadata;
    const commandId = metadata.id || context.name.split(' ').join('.');
    options.headers.set(NotSoHeaders.COMMAND_ID, commandId);
    options.headers.set(NotSoHeaders.MESSAGE_TRIGGER_ID, context.interactionId);
  } else if (context instanceof Command.Context) {
    if (context.command && context.command.metadata) {
      const commandMetadata = context.command.metadata;
      const commandId = commandMetadata.id || context.command.fullName.split(' ').join('.');
      options.headers.set(NotSoHeaders.COMMAND_ID, commandId);
      options.headers.set(NotSoHeaders.MESSAGE_TRIGGER_ID, context.messageId);
    }
  }

  if (options.file) {
    // copy instead of unshift so the caller's array isn't mutated (retries would upload the file twice)
    options.files = (options.files) ? [options.file, ...options.files] : [options.file];
  }

  const route = (options.route && options.route.path) || 'unknown';
  const started = Date.now();
  try {
    const response = await client.rest.request(options);
    recordApiRequest(route, '2xx', started);
    return response;
  } catch(error) {
    if (error && error.response) {
      error[IS_NOTSOBOT_API_ERROR] = true;
    }
    const status = (error && error.response) ? `${Math.floor(error.response.statusCode / 100)}xx` : 'error';
    recordApiRequest(route, status, started);
    throw error;
  }
}


function getDefaultMaxFileSize(
  context: RequestContext,
  options?: {maxFileSize?: number} | Record<string, any>,
): number {
  if (options && options.maxFileSize !== undefined) {
    return options.maxFileSize;
  }
  if (context.maxAttachmentSize) {
    return context.maxAttachmentSize;
  }
  if (context.guild) {
    return context.guild.maxAttachmentSize;
  }
  return MAX_ATTACHMENT_SIZE;
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


export async function createUserLLMMemory(
  context: RequestContext,
  userId: string,
  options: RestOptions.CreateUserLLMMemory,
): Promise<RestResponsesRaw.CreateUserLLMMemory> {
  const body = {
    content: options.content,
    server: options.server,
  };
  const params = {userId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.USER_LLM_MEMORIES,
      params,
    },
  });
}


export async function createReport(
  context: RequestContext,
  options: RestOptions.CreateReport,
): Promise<RestResponsesRaw.CreateReport> {
  const body = {
    channel_id: options.channelId,
    content: options.content,
    guild_id: options.guildId,
    message_id: options.messageId,
    tag_id: options.tagId,
    target_id: options.targetId,
    type: options.type,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.REPORTS,
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


// asks for the directory listing to be verified, locks the tag until staff review it
export async function createTagsDirectoryTagVerification(
  context: RequestContext,
  tagId: string,
): Promise<RestResponsesRaw.CreateTagsDirectoryTagVerification> {
  const params = {tagId};
  return request(context, {
    route: {
      method: HTTPMethods.POST,
      path: Api.TAGS_DIRECTORY_TAG_VERIFY,
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
    guild_id: options.guildId,
    message_response_id: options.messageResponseId,
    message_trigger_id: options.messageTriggerId,
    result: options.result,
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


export async function deleteCommandsResponses(
  context: RequestContext,
  options: RestOptions.DeleteCommandsResponses,
): Promise<RestResponsesRaw.DeleteCommandsResponses> {
  const query = {
    channel_id: options.channelId,
    trigger_ids: JSON.stringify(options.triggerIds),
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.DELETE,
      path: Api.COMMANDS_RESPONSES,
    },
  });
}


export async function deleteFile(
  context: RequestContext,
  fileId: string,
): Promise<RestResponsesRaw.FileResponseStorage> {
  const params = {fileId};
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.FILE,
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

export async function deleteUserLLMMemories(
  context: RequestContext,
  userId: string,
): Promise<RestResponsesRaw.DeleteUserLLMMemories> {
  const params = {userId};
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.USER_LLM_MEMORIES,
      params,
    },
  });
}


export async function deleteUserLLMMemory(
  context: RequestContext,
  userId: string,
  position: number | string,
): Promise<RestResponsesRaw.DeleteUserLLMMemory> {
  const params = {userId, position};
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.USER_LLM_MEMORY,
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

// cancels a pending verification request, unlocking the tag
export async function deleteTagsDirectoryTagVerification(
  context: RequestContext,
  tagId: string,
): Promise<RestResponsesRaw.DeleteTagsDirectoryTagVerification> {
  const params = {tagId};
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.TAGS_DIRECTORY_TAG_VERIFY,
      params,
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
    allowlist_admin_bypass: options.allowlistAdminBypass,
    blocked: options.blocked,
    blocked_reason: options.blockedReason,
    blocklist: options.blocklist,
    blocklist_admin_bypass: options.blocklistAdminBypass,
    commands_allowlist: options.commandsAllowlist,
    commands_allowlist_admin_bypass: options.commandsAllowlistAdminBypass,
    commands_blocklist: options.commandsBlocklist,
    commands_blocklist_admin_bypass: options.commandsBlocklistAdminBypass,
    locale: options.locale,
    ml_diffusion_model: options.mlDiffusionModel,
    ml_llm_model: options.mlLLMModel,
    ml_llm_personality: options.mlLLMPersonality,
    prefixes: options.prefixes,
    response_display: options.responseDisplay,
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


export async function editServerSettings(
  context: RequestContext,
  serverId: string,
  options: RestOptions.EditServerSettings = {},
): Promise<RestResponsesRaw.EditServerSettings> {
  const body = {
    blocked: options.blocked,
    blocked_reason: options.blockedReason,
    ml_diffusion_model: options.mlDiffusionModel,
    ml_llm_model: options.mlLLMModel,
    ml_llm_personality: options.mlLLMPersonality,
    timezone: options.timezone,
  };
  const params = {serverId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PATCH,
      path: Api.SERVER,
      params,
    },
  });
}


// only for `reminder delete server`, the api only lets this through for reminders in the same server
export async function moveReminderToDms(
  context: RequestContext,
  reminderId: string,
): Promise<RestResponsesRaw.EditReminder> {
  const params = {reminderId};
  return request(context, {
    route: {
      method: HTTPMethods.POST,
      path: Api.REMINDER_MOVE_TO_DMS,
      params,
    },
  });
}


export async function editReminder(
  context: RequestContext,
  reminderId: string,
  options: RestOptions.EditReminder,
): Promise<RestResponsesRaw.EditReminder> {
  // undefined fields are left out of the json, null clears them
  const body = {
    channel_id: options.channelId,
    content: options.content,
    guild_id: options.guildId,
    message_id: options.messageId,
    timestamp_end: options.timestampEnd,
    timestamp_start: options.timestampStart,
  };
  const params = {reminderId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PATCH,
      path: Api.REMINDER,
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


export async function editTagsDirectoryTag(
  context: RequestContext,
  tagId: string,
  options: RestOptions.EditTagsDirectoryTag,
): Promise<RestResponsesRaw.EditTagsDirectoryTag> {
  const body = {
    category: options.category,
    content_public: options.contentPublic,
    description: options.description,
    title: options.title,
  };
  const params = {tagId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PATCH,
      path: Api.TAGS_DIRECTORY_TAG,
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


export async function editUserLLMMemory(
  context: RequestContext,
  userId: string,
  position: number | string,
  options: RestOptions.EditUserLLMMemory,
): Promise<RestResponsesRaw.EditUserLLMMemory> {
  const body = {
    content: options.content,
  };
  const params = {userId, position};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PATCH,
      path: Api.USER_LLM_MEMORY,
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
    application_command_response_type: options.applicationCommandResponseType,
    download_quality: options.downloadQuality,
    fallbacks_media_image: options.fallbacksMediaImage,
    file_upload_threshold: options.fileUploadThreshold,
    file_upload_type: options.fileUploadType,
    locale: options.locale,
    ml_diffusion_model: options.mlDiffusionModel,
    ml_llm_memory_disabled: options.mlLLMMemoryDisabled,
    ml_llm_model: options.mlLLMModel,
    ml_llm_personality: options.mlLLMPersonality,
    response_display: options.responseDisplay,
    timezone: options.timezone,
    tts_voice: options.ttsVoice,
    units: options.units,
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


export async function fetchCommandsResponses(
  context: RequestContext,
  options: RestOptions.FetchCommandsResponses = {},
): Promise<RestResponsesRaw.FetchCommandsResponses> {
  const query = {
    after: options.after,
    before: options.before,
    channel_id: options.channelId,
    limit: options.limit,
    response_ids: options.responseIds && JSON.stringify(options.responseIds),
    trigger_ids: options.triggerIds && JSON.stringify(options.triggerIds),
    user_id: options.userId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.COMMANDS_RESPONSES,
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
    since: options.since,
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


export async function fetchFile(
  context: RequestContext,
  fileId: string,
): Promise<RestResponsesRaw.FileResponseStorage> {
  const params = {fileId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.FILE,
      params,
    },
  });
}


export async function fetchFileVanity(
  context: RequestContext,
  vanity: string,
): Promise<RestResponsesRaw.FileResponseStorage> {
  const params = {vanity};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.FILE_VANITY,
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


export async function deleteJob(
  context: RequestContext,
  jobId: string,
): Promise<null> {
  const params = {jobId};
  return request(context, {
    route: {
      method: HTTPMethods.DELETE,
      path: Api.JOB,
      params,
    },
  });
}


export async function fetchJob(
  context: RequestContext,
  jobId: string,
): Promise<RestResponsesRaw.JobResponse> {
  const params = {jobId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.JOB,
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


export async function putGuildTimedBans(
  context: RequestContext,
  guildId: string,
  options: RestOptions.PutGuildTimedBans,
): Promise<RestResponsesRaw.PutGuildTimedBans> {
  const body = {
    moderator_id: options.moderatorId,
    timestamp_end: options.timestampEnd,
    user_ids: options.userIds,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.GUILD_TIMED_BANS,
      params: {guildId},
    },
  });
}


export async function deleteGuildTimedBan(
  context: RequestContext,
  guildId: string,
  userId: string,
  options: RestOptions.DeleteGuildTimedBan = {},
): Promise<RestResponsesRaw.DeleteGuildTimedBan> {
  const query = {
    timed_ban_id: options.timedBanId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.DELETE,
      path: Api.GUILD_TIMED_BAN,
      params: {guildId, userId},
    },
  });
}


export async function deleteGuildTimedBans(
  context: RequestContext,
  guildId: string,
  options: RestOptions.DeleteGuildTimedBans,
): Promise<RestResponsesRaw.DeleteGuildTimedBans> {
  const body = {
    user_ids: options.userIds,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.GUILD_TIMED_BANS_DELETE,
      params: {guildId},
    },
  });
}


export async function fetchGuildTimedBans(
  context: RequestContext,
  guildId: string,
): Promise<RestResponsesRaw.FetchGuildTimedBans> {
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.GUILD_TIMED_BANS,
      params: {guildId},
    },
  });
}


export async function fetchTimedBans(
  context: RequestContext,
  options: RestOptions.FetchTimedBans = {},
): Promise<RestResponsesRaw.FetchTimedBans> {
  const query = {
    after: options.after,
    before: options.before,
    limit: options.limit,
    timestamp_max: options.timestampMax,
    timestamp_min: options.timestampMin,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TIMED_BANS,
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


export async function fetchReports(
  context: RequestContext,
  options: RestOptions.FetchReports = {},
): Promise<RestResponsesRaw.FetchReports> {
  const query = {
    limit: options.limit,
    status: options.status,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.REPORTS,
    },
  });
}


export async function fetchServerSettings(
  context: RequestContext,
  serverId: string,
): Promise<RestResponsesRaw.FetchServerSettings> {
  const params = {serverId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.SERVER,
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


// the public tag directory listing
export async function fetchTagsDirectory(
  context: RequestContext,
  options: RestOptions.FetchTagsDirectory = {},
): Promise<RestResponsesRaw.FetchTagsDirectory> {
  const query = {
    limit: options.limit,
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAGS_DIRECTORY,
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
    sort_by: options.sortBy,
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


export async function postTagsImport(
  context: RequestContext,
  serverId: string,
  options: RestOptions.PostTagsImport,
): Promise<RestResponsesRaw.PostTagsImport> {
  const body = {
    can_manage: options.canManage,
    guild_id: options.guildId,
    overwrite: options.overwrite,
    server_id: serverId,
    url: options.url,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.TAGS_IMPORT,
    },
  });
}


export async function fetchTagsExport(
  context: RequestContext,
  serverId: string,
  options: RestOptions.FetchTagsExport = {},
): Promise<RestResponsesRaw.FetchTagsExport> {
  const query = {
    content: options.content,
    name: options.name,
    server_id: serverId,
    user_id: options.userId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAGS_EXPORT,
    },
  });
}


export async function fetchTagBlobs(
  context: RequestContext,
  tagId: string,
  options: RestOptions.FetchTagBlobs,
): Promise<RestResponsesRaw.FetchTagBlobs> {
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
      path: Api.TAG_BLOBS,
      params,
    },
  });
}


export async function fetchTagStorage(
  context: RequestContext,
  tagId: string,
  options: RestOptions.FetchTagStorage = {},
): Promise<RestResponsesRaw.FetchTagStorage> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const params = {tagId};
  const query = {
    max_file_size: maxFileSize,
    server_id: options.serverId,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.TAG_STORAGE,
      params,
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


export async function fetchUserLLMMemories(
  context: RequestContext,
  userId: string,
): Promise<RestResponsesRaw.FetchUserLLMMemories> {
  const params = {userId};
  return request(context, {
    route: {
      method: HTTPMethods.GET,
      path: Api.USER_LLM_MEMORIES,
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


export async function funAsciiArtFromImage(
  context: RequestContext,
  options: RestOptions.FunAsciiArtFromImage,
): Promise<RestResponsesRaw.FunAsciiArtFromImage> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    size: options.size,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.FUN_ASCII_ART_FROM_IMAGE,
    },
  });
}


export async function funAsciiArtFromText(
  context: RequestContext,
  options: RestOptions.FunAsciiArtFromText,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    text: options.text,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.FUN_ASCII_ART_FROM_TEXT,
    },
  });
}


export async function funTextToSpeech(
  context: RequestContext,
  options: RestOptions.FunTextToSpeech,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
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
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    memory: options.memory,
    model: options.model,
    personality: options.personality,
    personality_preference: options.personalityPreference,
    prompt: options.prompt,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    horizontal: options.horizontal,
    max_file_size: maxFileSize,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_ADHD,
    },
  });
}


export async function mediaAIVManipulationAndroid(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationAndroid,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_ANDROID,
    },
  });
}


export async function mediaAIVManipulationAudioPutConcat(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationAudioPutBase,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    longest: options.longest,
    loop: !options.noloop,
    max_file_size: maxFileSize,
    safe: options.safe,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_AUDIO_PUT_CONCAT,
    },
  });
}


export async function mediaAIVManipulationAudioPutMix(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationAudioPutBase,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    longest: options.longest,
    loop: !options.noloop,
    max_file_size: maxFileSize,
    safe: options.safe,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_AUDIO_PUT_MIX,
    },
  });
}


export async function mediaAIVManipulationAudioPutReplace(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationAudioPutBase,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    longest: options.longest,
    loop: !options.noloop,
    max_file_size: maxFileSize,
    safe: options.safe,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_AUDIO_PUT_REPLACE,
    },
  });
}


export async function mediaAIVManipulationConcat(
  context: RequestContext,
  options: RestOptions.MediaBaseOptionsMultiple,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_CONCAT,
    },
  });
}


export async function mediaAIVManipulationConvert(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationConvert,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    remove_audio: options.removeAudio,
    safe: options.safe,
    size: options.size,
    to: options.to,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_CONVERT,
    },
  });
}


export async function mediaAIVManipulationFadeIn(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationFadeIn,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    color: options.color,
    duration: options.duration,
    max_file_size: maxFileSize,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    color: options.color,
    duration: options.duration,
    max_file_size: maxFileSize,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_FADE_OUT,
    },
  });
}


export async function mediaAIVManipulationExtractMedia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_EXTRACT_MEDIA,
    },
  });
}


export async function mediaAIVManipulationJoin(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationJoin,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    loop: !options.noloop,
    max_file_size: maxFileSize,
    no_resize: options.noresize,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    urls: options.urls,
    vertical: options.vertical,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_JOIN,
    },
  });
}


export async function mediaAIVManipulationOverlay(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationOverlay,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    blend: options.blend,
    color: options.color,
    loop: !options.noloop,
    max_file_size: maxFileSize,
    opacity: options.opacity,
    resize: options.resize,
    safe: options.safe,
    similarity: options.similarity,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
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
      path: Api.MEDIA_AIV_MANIPULATION_OVERLAY,
    },
  });
}


export async function mediaAIVManipulationReverse(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationReverse,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    audio: !options.noaudio,
    max_file_size: maxFileSize,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_REVERSE,
    },
  });
}


export async function mediaAIVManipulationSeeSaw(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_SEE_SAW,
    },
  });
}


export async function mediaAIVManipulationShuffle(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationShuffle,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    segment: options.segment,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_SHUFFLE,
    },
  });
}


export async function mediaAIVManipulationSnip(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationSnip,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    audio_only: options.audioOnly,
    end: options.end,
    max_file_size: maxFileSize,
    safe: options.safe,
    start: options.start,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_SNIP,
    },
  });
}


export async function mediaAIVManipulationSpeed(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationSpeed,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    speed: options.speed,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_MANIPULATION_SPEED,
    },
  });
}


export async function mediaAIVToolsAnalyze(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.MediaAIVToolsAnalyze> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    url: options.url,
  };
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_ANALYZE,
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
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AIV_TOOLS_EXIF,
    },
  });
}


export async function mediaAVManipulationAudioBoostBass(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_BOOST_BASS,
    },
  });
}


export async function mediaAVManipulationAudioChannelsCombine(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_CHANNELS_COMBINE,
    },
  });
}


export async function mediaAVManipulationAudioChannelsInvert(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_CHANNELS_INVERT,
    },
  });
}


export async function mediaAVManipulationAudioCompress(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioCompress,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    no_revert: options.norevert,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_COMPRESS,
    },
  });
}


export async function mediaAVManipulationAudioDelay(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioDelay,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    delay: options.delay,
    max_file_size: maxFileSize,
    safe: options.safe,
    snip: options.snip,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_DELAY,
    },
  });
}


export async function mediaAVManipulationAudioDestroy(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_DESTROY,
    },
  });
}


export async function mediaAVManipulationAudioEqualizer(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioEqualizer,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    air: options.air,
    bass: options.bass,
    high_mids: options.highMids,
    low_mids: options.lowMids,
    max_file_size: maxFileSize,
    mids: options.mids,
    safe: options.safe,
    sub_bass: options.subBass,
    treble: options.treble,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_EQUALIZER,
    },
  });
}


export async function mediaAVManipulationAudioFlanger(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioFlanger,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    delay: options.delay,
    depth: options.depth,
    max_file_size: maxFileSize,
    phase: options.phase,
    regen: options.regen,
    safe: options.safe,
    speed: options.speed,
    url: options.url,
    width: options.width,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_FLANGER,
    },
  });
}


export async function mediaAVManipulationAudioPitch(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioPitch,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_PITCH,
    },
  });
}


export async function mediaAVManipulationAudioReverb(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioReverb,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    decay: options.decay,
    delay: options.delay,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
    volume: options.volume,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_REVERB,
    },
  });
}


export async function mediaAVManipulationAudioReverse(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_REVERSE,
    },
  });
}


export async function mediaAVManipulationAudioTremolo(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioTremolo,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    depth: options.depth,
    frequency: options.frequency,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_TREMOLO,
    },
  });
}


export async function mediaAVManipulationAudioVibrato(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioVibrato,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    depth: options.depth,
    frequency: options.frequency,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_VIBRATO,
    },
  });
}


export async function mediaAVManipulationAudioVolume(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioVolume,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
    volume: options.volume,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_AUDIO_VOLUME,
    },
  });
}


export async function mediaAVManipulationSetBitRate(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationSetBitRate,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    audio: options.audio,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
    video: options.video,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_SET_BITRATE,
    },
  });
}


export async function mediaAVManipulationStammer(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationStammer,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    color_mode: options.colorMode,
    matcher_mode: options.matcherMode,
    max_file_size: maxFileSize,
    safe: options.safe,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_MANIPULATION_STAMMER,
    },
  });
}


export async function mediaAVToolsExtractAudio(
  context: RequestContext,
  options: RestOptions.MediaAVToolsExtractAudio,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    allowed_mimetypes: options.allowedMimetypes,
    max_file_size: maxFileSize,
    mimetype: options.mimetype,
    safe: options.safe,
    url: options.url,
    waveform: options.waveform,
  };
  return request(context, {
    file: options.file,
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
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_AV_TOOLS_TRANSCRIBE,
    },
  });
}


export async function mediaICreateHacker(
  context: RequestContext,
  options: RestOptions.MediaICreateHacker,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    safe: options.safe,
    template: options.template,
    text: options.text,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_CREATE_HACKER,
    },
  });
}


export async function mediaICreatePresidential(
  context: RequestContext,
  options: RestOptions.MediaICreatePresidential,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    date: options.date,
    max_file_size: maxFileSize,
    safe: options.safe,
    text: options.text,
    time: options.time,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_CREATE_PRESIDENTIAL,
    },
  });
}


export async function mediaICreateRealfact(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    safe: options.safe,
    text: options.text,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_CREATE_REALFACT,
    },
  });
}


export async function mediaICreateRetrowave(
  context: RequestContext,
  options: RestOptions.MediaICreateRetrowave,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    background: options.background,
    line_1: options.line1,
    line_2: options.line2,
    line_3: options.line3,
    max_file_size: maxFileSize,
    safe: options.safe,
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


export async function mediaICreateSonic(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    safe: options.safe,
    text: options.text,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_CREATE_SONIC,
    },
  });
}


export async function mediaICreateThonkify(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    safe: options.safe,
    text: options.text,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_CREATE_THONKIFY,
    },
  });
}


export async function mediaICreateTombstone(
  context: RequestContext,
  options: RestOptions.MediaICreateTombstone,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    line_1: options.line1,
    line_2: options.line2,
    line_3: options.line3,
    line_4: options.line4,
    line_5: options.line5,
    max_file_size: maxFileSize,
    safe: options.safe,
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
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    safe: options.safe,
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


export async function mediaIManipulationBill(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_BILL,
    },
  });
}


export async function mediaIManipulationBurn(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_BURN,
    },
  });
}


export async function mediaIManipulationFaceAlien(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_FACE_ALIEN,
    },
  });
}


export async function mediaIManipulationFaceAnime(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_FACE_ANIME,
    },
  });
}


export async function mediaIManipulationFaceClown(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_FACE_CLOWN,
    },
  });
}


export async function mediaIManipulationFaceFat(
  context: RequestContext,
  options: RestOptions.MediaIManipulationFaceFat,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    size: options.size,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_FACE_FAT,
    },
  });
}


export async function mediaIManipulationFaceMountRushmore(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_FACE_MOUNT_RUSHMORE,
    },
  });
}


export async function mediaIManipulationLatte(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_LATTE,
    },
  });
}


export async function mediaIManipulationMuseum(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_MUSEUM,
    },
  });
}


export async function mediaIManipulationPopArt(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_POP_ART,
    },
  });
}


export async function mediaIManipulationTimesquare(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_TIMESQUARE,
    },
  });
}


export async function mediaIManipulationUniverse(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_I_MANIPULATION_UNIVERSE,
    },
  });
}


export async function mediaIVManipulationAcid(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAcid,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amount: options.amount,
    levels: options.levels,
    max_file_size: maxFileSize,
    safe: options.safe,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_ACID,
    },
  });
}


export async function mediaIVManipulationAscii(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAscii,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    invert: options.invert,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
    zoom: options.zoom,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_ASCII,
    },
  });
}


export async function mediaIVManipulationBackgroundRemove(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationBackgroundRemoveOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    model: options.model,
    safe: options.safe,
    trim: options.trim,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_BACKGROUND_REMOVE,
    },
  });
}


export async function mediaIVManipulationBlur(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationBlur,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    bottom: options.bottom,
    font: options.font,
    max_file_size: maxFileSize,
    safe: options.safe,
    top: options.top,
    url: options.url,
  };
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CAPTION,
    },
  });
}


export async function mediaIVManipulationCartoon(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCartoon,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    amount: options.amount,
    brightness: options.brightness,
    levels: options.levels,
    max_file_size: maxFileSize,
    method: options.method,
    pattern: options.pattern,
    safe: options.safe,
    saturation: options.saturation,
    url: options.url,
  };
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CARTOON,
    },
  });
}


export async function mediaIVManipulationCharcoal(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCharcoal,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    radius: options.radius,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CHARCOAL,
    },
  });
}


export async function mediaIVManipulationCharcoalAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCharcoal,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    radius: options.radius,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CHARCOAL_ANIMATED,
    },
  });
}


export async function mediaIVManipulationCircle(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCircle,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CIRCLE,
    },
  });
}


export async function mediaIVManipulationCrop(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCrop,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    height: options.height,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
    width: options.width,
    x: options.x,
    y: options.y,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CROP,
    },
  });
}


export async function mediaIVManipulationCropAuto(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CROP_AUTO,
    },
  });
}


export async function mediaIVManipulationCropCircle(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CROP_CIRCLE,
    },
  });
}


export async function mediaIVManipulationCropTriangle(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CROP_TRIANGLE,
    },
  });
}


export async function mediaIVManipulationCropTwitterHex(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_CROP_TWITTER_HEX,
    },
  });
}


export async function mediaIVManipulationDatamosh(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDatamosh,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    chance: options.chance,
    max_file_size: maxFileSize,
    repeat: options.repeat,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_DATAMOSH,
    },
  });
}


export async function mediaIVManipulationDeepfry(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDeepfry,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    keep_transparency: options.keepTransparency,
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_DEEPFRY,
    },
  });
}


export async function mediaIVManipulationDerain(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_DERAIN,
    },
  });
}


export async function mediaIVManipulationDetunnel(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationTunnel,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    spiral: options.spiral,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_DETUNNEL,
    },
  });
}


export async function mediaIVManipulationDice(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDice,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    grid: options.grid,
    max_file_size: maxFileSize,
    safe: options.safe,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_DICE,
    },
  });
}


export async function mediaIVManipulationDistort(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDistort,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    arguments: options.arguments,
    max_file_size: maxFileSize,
    method: options.method,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_DISTORT,
    },
  });
}


export async function mediaIVManipulationDrawFaces(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_DRAW_FACES,
    },
  });
}


export async function mediaIVManipulationEdgeDetect(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEdgeDetect,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    invert: options.invert,
    max_file_size: maxFileSize,
    method: options.method,
    mix: options.mix,
    safe: options.safe,
    strength: options.strength,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_EDGE_DETECT,
    },
  });
}


export async function mediaIVManipulationEmboss(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEmboss,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    azimuth: options.azimuth,
    compose: options.compose,
    elevation: options.elevation,
    depth: options.depth,
    intensity: options.intensity,
    gray: options.gray,
    max_file_size: maxFileSize,
    method: options.method,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_EMBOSS,
    },
  });
}


export async function mediaIVManipulationEmojiMosaic(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEmojiMosaic,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    size: options.size,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_EMOJI_MOSAIC,
    },
  });
}


export async function mediaIVManipulationExo(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationExo,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    rain: options.rain,
    safe: options.safe,
    swirl: options.swirl,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_EXO,
    },
  });
}


export async function mediaIVManipulationExplode(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationExplode,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_EXPLODE,
    },
  });
}


export async function mediaIVManipulationExplodeAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationExplode,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_EXPLODE_ANIMATED,
    },
  });
}


export async function mediaIVManipulationEyes(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEyes,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    flipped: options.flipped,
    max_file_size: maxFileSize,
    safe: options.safe,
    type: options.type,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_EYES,
    },
  });
}


export async function mediaIVManipulationFisheye(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_FISHEYE,
    },
  });
}


export async function mediaIVManipulationFlash(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    delay: options.delay,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_FLASH,
    },
  });
}


export async function mediaIVManipulationFlip(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amount: options.amount,
    iterations: options.iterations,
    keep_transparency: options.keepTransparency,
    max_file_size: maxFileSize,
    safe: options.safe,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amount: options.amount,
    iterations: options.iterations,
    keep_transparency: options.keepTransparency,
    max_file_size: maxFileSize,
    safe: options.safe,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GLITCH_ANIMATED,
    },
  });
}


export async function mediaIVManipulationGlobe(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlobe,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    tiled: options.tiled,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GLOBE,
    },
  });
}


export async function mediaIVManipulationGlow(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlow,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amount: options.amount,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GLOW,
    },
  });
}


export async function mediaIVManipulationGold(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GOLD,
    },
  });
}


export async function mediaIVManipulationGrain(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGrain,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    flags: options.flags,
    max_file_size: maxFileSize,
    safe: options.safe,
    strength: options.strength,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GRAIN,
    },
  });
}


export async function mediaIVManipulationGrayscale(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_GRAYSCALE,
    },
  });
}


export async function mediaIVManipulationHueCurveRGBA(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueCurveRGBA,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    all: options.all,
    alpha: options.alpha,
    blue: options.blue,
    green: options.green,
    max_file_size: maxFileSize,
    red: options.red,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_HUE_CURVE_RGBA,
    },
  });
}


export async function mediaIVManipulationHueShiftHSV(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftHSV,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    brightness: options.brightness,
    hue: options.hue,
    max_file_size: maxFileSize,
    safe: options.safe,
    saturation: options.saturation,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_HUE_SHIFT_HSV,
    },
  });
}


export async function mediaIVManipulationHueShiftHSVFFMPEG(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftHSV,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    brightness: options.brightness,
    hue: options.hue,
    max_file_size: maxFileSize,
    safe: options.safe,
    saturation: options.saturation,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_HUE_SHIFT_HSV_FFMPEG,
    },
  });
}


export async function mediaIVManipulationHueShiftRGB(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftRGB,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    blue: options.blue,
    green: options.green,
    max_file_size: maxFileSize,
    red: options.red,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_IMPLODE,
    },
  });
}


export async function mediaIVManipulationImplodeAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationImplode,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_IMPLODE_ANIMATED,
    },
  });
}


export async function mediaIVManipulationInOut(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    delay: options.delay,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_IN_OUT,
    },
  });
}


export async function mediaIVManipulationInvert(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    alpha: options.alpha,
    blue: options.blue,
    green: options.green,
    max_file_size: maxFileSize,
    red: options.red,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    keep_transparency: options.keepTransparency,
    max_file_size: maxFileSize,
    quality: options.quality,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_JPEG,
    },
  });
}


export async function mediaIVManipulationLabelsAnalysis(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LABELS_ANALYSIS,
    },
  });
}


export async function mediaIVManipulationLabelsExcuse(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LABELS_EXCUSE,
    },
  });
}


export async function mediaIVManipulationLabelsIFunny(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LABELS_IFUNNY,
    },
  });
}


export async function mediaIVManipulationLabelsKirby(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LABELS_KIRBY,
    },
  });
}


export async function mediaIVManipulationLabelsPerfection(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LABELS_PERFECTION,
    },
  });
}


export async function mediaIVManipulationLabelsTriggered2(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LABELS_TRIGGERED_2,
    },
  });
}


export async function mediaIVManipulationLabelsTriggered3(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LABELS_TRIGGERED_3,
    },
  });
}


export async function mediaIVManipulationLayer(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_LAYER,
    },
  });
}


export async function mediaIVManipulationLegofy(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationLegofy,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    dither: options.dither,
    max_file_size: maxFileSize,
    palette: options.palette,
    safe: options.safe,
    size: options.size,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MAGIK,
    },
  });
}


export async function mediaIVManipulationMagikAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMagikAnimated,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    boomerang: options.boomerang,
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MAGIK_ANIMATED,
    },
  });
}


export async function mediaIVManipulationMandalaScope(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMandalaScope,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amount: options.amount,
    max_file_size: maxFileSize,
    rotation: options.rotation,
    safe: options.safe,
    scale: options.scale,
    translation: options.translation,
    url: options.url,
    zoom: options.zoom,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MANDALASCOPE,
    },
  });
}


export async function mediaIVManipulationMeme(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMeme,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    bottom: options.bottom,
    font: options.font,
    max_file_size: maxFileSize,
    safe: options.safe,
    top: options.top,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MIRROR_TOP,
    },
  });
}


export async function mediaIVManipulationMotionBlur(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMotionBlur,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    strength: options.strength,
    url: options.url,
    vertical: options.vertical,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MOTION_BLUR,
    },
  });
}


export async function mediaIVManipulationMultiply(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMultiply,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    grid: options.grid,
    max_file_size: maxFileSize,
    rotate: options.rotate,
    safe: options.safe,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_MULTIPLY,
    },
  });
}


export async function mediaIVManipulationOffset(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOffset,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
    x: options.x,
    y: options.y,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OFFSET,
    },
  });
}


export async function mediaIVManipulationOrb(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOrb,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    direction: options.direction,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_ORB,
    },
  });
}


export async function mediaIVManipulationOutIn(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    delay: options.delay,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OUT_IN,
    },
  });
}


export async function mediaIVManipulationOverlay9Gag(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_9GAG,
    },
  });
}


export async function mediaIVManipulationOverlayAdidas(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_ADIDAS,
    },
  });
}


export async function mediaIVManipulationOverlayBandicam(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_BANDICAM,
    },
  });
}


export async function mediaIVManipulationOverlayBinoculars(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_BINOCULARS,
    },
  });
}


export async function mediaIVManipulationOverlayBlackPanther(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_BLACK_PANTHER,
    },
  });
}


export async function mediaIVManipulationOverlayBrazzers(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_BRAZZERS,
    },
  });
}


export async function mediaIVManipulationOverlayCoolGuy(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_COOL_GUY,
    },
  });
}


export async function mediaIVManipulationOverlayDork(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_DORK,
    },
  });
}


export async function mediaIVManipulationOverlayFace(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayFace,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    safe: options.safe,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    amount: options.amount,
    degrees: options.degrees,
    max_file_size: maxFileSize,
    safe: options.safe,
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


export async function mediaIVManipulationOverlayGod(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_GOD,
    },
  });
}


export async function mediaIVManipulationOverlayGoldStar(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_GOLD_STAR,
    },
  });
}


export async function mediaIVManipulationOverlayHalfLifePistol(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_HALF_LIFE_SMG,
    },
  });
}


export async function mediaIVManipulationOverlayHyperCam(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_HYPERCAM,
    },
  });
}


export async function mediaIVManipulationOverlayMistake(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_MISTAKE,
    },
  });
}


export async function mediaIVManipulationOverlayOldGuy(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_OLD_GUY,
    },
  });
}


export async function mediaIVManipulationOverlayOwO(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_OWO,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsAjitPai1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_AJIT_PAI_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsAustinEvans1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_AUSTIN_EVANS_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsBernie1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_GABEN_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsIDubbbz1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_IDUBBBZ_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsJacksfilms1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_JACKSFILMS_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsJesus1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_JESUS_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsKeemstar1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_KEEMSTAR_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsKeemstar2(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_KEEMSTAR_2,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsLTTLinus1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_LTT_LINUS_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsMirandaCosgrove1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_MIRANDA_COSGROVE_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsTrump1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_TRUMP_1,
    },
  });
}


export async function mediaIVManipulationOverlayPersonsZuckerberg1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_ZUCKERBERG_1,
    },
  });
}


export async function mediaIVManipulationOverlayRespects(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_RESPECTS,
    },
  });
}


export async function mediaIVManipulationOverlayRTX(
  context: RequestContext,
  options: RestOptions.MediaBaseOptionsMultiple,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    safe: options.safe,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_RTX,
    },
  });
}


export async function mediaIVManipulationOverlayShutterstock(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_STARMAN,
    },
  });
}


export async function mediaIVManipulationOverlaySupreme(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_SUPREME,
    },
  });
}


export async function mediaIVManipulationOverlayThinking(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_THINKING,
    },
  });
}


export async function mediaIVManipulationOverlayWasted(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_WASTED,
    },
  });
}


export async function mediaIVManipulationOverlayWatchMojo(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayWatchMojo,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    max_file_size: maxFileSize,
    safe: options.safe,
    text: options.text,
    url: options.url,
  };
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_WATCHMOJO,
    },
  });
}


export async function mediaIVManipulationOverlayWatermark(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayWatermark,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    margin: options.margin,
    max_file_size: maxFileSize,
    opacity: options.opacity,
    safe: options.safe,
    size: options.size,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_WATERMARK,
    },
  });
}


export async function mediaIVManipulationOverlayWheeze(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_WHEEZE,
    },
  });
}


export async function mediaIVManipulationOverlayWhoDidThis(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_WHO_DID_THIS,
    },
  });
}


export async function mediaIVManipulationOverlayYusuke(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_OVERLAY_YUSUKE,
    },
  });
}


export async function mediaIVManipulationPaint(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPaint,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    radius: options.radius,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_PAINT,
    },
  });
}


export async function mediaIVManipulationPaintAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPaint,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    radius: options.radius,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_PAINT_ANIMATED,
    },
  });
}


export async function mediaIVManipulationPaper(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_PAPER,
    },
  });
}


export async function mediaIVManipulationPhoSimp(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPhoSimp,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    filters: options.filters,
    grid_x: options.gridx,
    grid_y: options.gridy,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    body,
    file: options.file,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_PHOSIMP,
    },
  });
}


export async function mediaIVManipulationPix2Pix(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPix2Pix,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    model: options.model,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    no_lines: options.noLines,
    pixel_width: options.pixelWidth,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_PIXELATE,
    },
  });
}


export async function mediaIVManipulationPixelSort(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPixelSort,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    angle: options.angle,
    interval: options.interval,
    length: options.length,
    lower: options.lower,
    max_file_size: maxFileSize,
    randomness: options.randomness,
    reverse: options.reverse,
    safe: options.safe,
    seed: options.seed,
    sort_by: options.sortBy,
    upper: options.upper,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_PIXEL_SORT,
    },
  });
}


export async function mediaIVManipulationQuadart(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationQuadart,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    type: options.type,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_QUADART,
    },
  });
}


export async function mediaIVManipulationRain(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_RAIN,
    },
  });
}


export async function mediaIVManipulationRainbow(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_RAINBOW,
    },
  });
}


export async function mediaIVManipulationRainGold(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_RECOLOR,
    },
  });
}


export async function mediaIVManipulationResize(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationResize,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    kernel: options.kernel,
    max_file_size: maxFileSize,
    ratio: options.ratio,
    safe: options.safe,
    scale: options.scale,
    size: options.size,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_RESIZE,
    },
  });
}


export async function mediaIVManipulationRGBSplit(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationRGBSplit,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    offset: options.offset,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_RGB_SPLIT,
    },
  });
}


export async function mediaIVManipulationRipple(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationRipple,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amplitude: options.amplitude,
    max_file_size: maxFileSize,
    offset: options.offset,
    power: options.power,
    rmin: options.rmin,
    safe: options.safe,
    type: options.type,
    url: options.url,
    width: options.width,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_RIPPLE,
    },
  });
}


export async function mediaIVManipulationRotate(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationRotate,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    crop: options.crop,
    degrees: options.degrees,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_ROTATE,
    },
  });
}


export async function mediaIVManipulationRotate3d(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationRotate3d,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    crop: options.crop,
    max_file_size: maxFileSize,
    order: options.order,
    pan: options.pan,
    safe: options.safe,
    roll: options.roll,
    tilt: options.tilt,
    url: options.url,
    zoom: options.zoom,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_ROTATE_3d,
    },
  });
}


export async function mediaIVManipulationScramble(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationScramble,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    grid: options.grid,
    max_file_size: maxFileSize,
    rotate: (options.norotate) ? false : options.rotate,
    safe: options.safe,
    seed: options.seed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SCRAMBLE,
    },
  });
}


export async function mediaIVManipulationSepia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SEPIA,
    },
  });
}


export async function mediaIVManipulationSetFPS(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSetFPS,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    fps: options.fps,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SET_FPS,
    },
  });
}


export async function mediaIVManipulationSetFrameCount(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSetFrameCount,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    count: options.count,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SET_FRAME_COUNT,
    },
  });
}


export async function mediaIVManipulationShake(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationShake,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    horizontal: options.horizontal,
    max_file_size: maxFileSize,
    randomize: options.randomize,
    safe: options.safe,
    url: options.url,
    vertical: options.vertical,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SHAKE,
    },
  });
}


export async function mediaIVManipulationShakeTriggered(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SHAKE_TRIGGERED,
    },
  });
}


export async function mediaIVManipulationSharpen(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSharpen,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    scale: options.scale,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SHARPEN,
    },
  });
}


export async function mediaIVManipulationSideToSide(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    delay: options.delay,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SIDE_TO_SIDE,
    },
  });
}


export async function mediaIVManipulationSlide(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSlide,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    direction: options.direction,
    max_file_size: maxFileSize,
    safe: options.safe,
    speed: options.speed,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SLIDE,
    },
  });
}


export async function mediaIVManipulationSmile(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SMILE,
    },
  });
}


export async function mediaIVManipulationSnipFrames(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSnipFrames,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    end: options.end,
    max_file_size: maxFileSize,
    safe: options.safe,
    start: options.start,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SNIP_FRAMES,
    },
  });
}


export async function mediaIVManipulationSolarize(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SOLARIZE,
    },
  });
}


export async function mediaIVManipulationSpin(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSpin,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    circle: options.circle,
    clockwise: options.clockwise,
    crop: options.crop,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SPIN,
    },
  });
}


export async function mediaIVManipulationSpin3d(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSpin3d,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    clockwise: options.clockwise,
    max_file_size: maxFileSize,
    safe: options.safe,
    tilt: options.tilt,
    url: options.url,
    zoom: options.zoom,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SPIN_3D,
    },
  });
}


export async function mediaIVManipulationStretch(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationStretch,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    crop: options.crop,
    height: options.height,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
    width: options.width,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_STRETCH,
    },
  });
}


export async function mediaIVManipulationSwapColors(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    channels: options.channels,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    degrees: options.degrees,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_SWIRL,
    },
  });
}


export async function mediaIVManipulationToGif(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_TO_GIF,
    },
  });
}


export async function mediaIVManipulationTrace(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_TRACE,
    },
  });
}


export async function mediaIVManipulationTrim(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationTrim,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    margin: options.margin,
    max_file_size: maxFileSize,
    safe: options.safe,
    threshold: options.threshold,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_TRIM,
    },
  });
}


export async function mediaIVManipulationTunnel(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationTunnel,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    spiral: options.spiral,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_TUNNEL,
    },
  });
}


export async function mediaIVManipulationUncaption(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationUncaption,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    tolerance: options.tolerance,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_UNCAPTION,
    },
  });
}


export async function mediaIVManipulationUpToDown(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    delay: options.delay,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_UP_TO_DOWN,
    },
  });
}


export async function mediaIVManipulationVaporwave(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationVaporwave,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    text: options.text,
    url: options.url,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_WALL,
    },
  });
}


export async function mediaIVManipulationWatercolor(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWatercolor,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    contrast: options.contrast,
    edge: options.edge,
    max_file_size: maxFileSize,
    mixing: options.mixing,
    safe: options.safe,
    smoothing: options.smoothing,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_WATERCOLOR,
    },
  });
}


export async function mediaIVManipulationWave(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWave,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amplitude: options.amplitude,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
    wave_length: options.waveLength,
  };
  return request(context, {
    file: options.file,
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
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amplitude: options.amplitude,
    max_file_size: maxFileSize,
    safe: options.safe,
    speed: options.speed,
    url: options.url,
    wave_length: options.waveLength,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_WAVE_ANIMATED,
    },
  });
}


export async function mediaIVManipulationWiggle(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWiggle,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amount: options.amount,
    direction: options.direction,
    loop: options.loop,
    max_file_size: maxFileSize,
    safe: options.safe,
    speed: options.speed,
    url: options.url,
    wavelengths: options.wavelengths,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_WIGGLE,
    },
  });
}


export async function mediaIVManipulationZoom(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationZoom,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amount: options.amount,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_ZOOM,
    },
  });
}


export async function mediaIVManipulationZoomBlur(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationZoomBlur,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    amount: options.amount,
    expand: options.expand,
    max_file_size: maxFileSize,
    safe: options.safe,
    url: options.url,
  };
  return request(context, {
    file: options.file,
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.MEDIA_IV_MANIPULATION_ZOOM_BLUR,
    },
  });
}


export async function moderationSafetyScan(
  context: RequestContext,
  options: RestOptions.ModerationSafetyScan,
): Promise<RestResponsesRaw.ModerationSafetyScan> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    context: options.context,
    custom_category: options.customCategory,
    custom_instruct: options.customInstruct,
    custom_query: options.customQuery,
    custom_threshold: options.customThreshold,
    extract_frames: options.extractFrames,
    log_flags: options.logFlags,
    max_file_size: maxFileSize,
    safe: options.safe,
    source_url: options.sourceUrl,
    text: options.text,
    urls: options.urls,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.MODERATION_SAFETY_SCAN,
    },
  });
}


export async function moderationTextScan(
  context: RequestContext,
  options: RestOptions.ModerationTextScan,
): Promise<RestResponsesRaw.ModerationTextScan> {
  const body = {
    context: options.context,
    safe: options.safe,
    text: options.text,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.MODERATION_TEXT_SCAN,
    },
  });
}


export async function putGeneratedTagError(
  context: RequestContext,
  responseId: string,
  options: RestOptions.PutGeneratedTagError,
) {
  const body = {
    error: options.error,
  };
  const params = {responseId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.TAGS_GENERATE_RESPONSE,
      params,
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


export async function putInfoMetrics(
  context: RequestContext,
  options: RestOptions.PutInfoMetrics,
): Promise<RestResponses.PutInfoMetrics> {
  const body = {
    cluster_id: options.clusterId,
    histograms: options.histograms,
    samples: options.samples,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.INFO_METRICS,
    },
  });
}


export async function putInfoDiscordGuilds(
  context: RequestContext,
  options: RestOptions.PutInfoDiscordGuilds,
): Promise<RestResponses.PutInfoDiscordGuilds> {
  const body = {
    guild_ids: options.guildIds,
    shard_count: options.shardCount,
    shard_id: options.shardId,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.INFO_DISCORD_GUILDS,
    },
  });
}


export async function postInfoDiscordGuildsChanges(
  context: RequestContext,
  options: RestOptions.PostInfoDiscordGuildsChanges,
): Promise<RestResponses.PostInfoDiscordGuildsChanges> {
  const body = {
    added: options.added.map((x) => ({guild_id: x.guildId, member_count: x.memberCount || 0, shard_id: x.shardId})),
    removed: options.removed,
    shard_count: options.shardCount,
  };
  return request(context, {
    body,
    route: {
      method: HTTPMethods.POST,
      path: Api.INFO_DISCORD_GUILDS_CHANGES,
    },
  });
}


export async function putServerSettings(
  context: RequestContext,
  serverId: string,
  options: RestOptions.PutServerSettings,
): Promise<RestResponsesRaw.EditServerSettings> {
  const body = {};
  const params = {serverId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.SERVER,
      params,
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


export async function putTagsDirectoryTag(
  context: RequestContext,
  tagId: string,
  options: RestOptions.PutTagsDirectoryTag,
): Promise<RestResponsesRaw.PutTagsDirectoryTag> {
  const body = {
    category: options.category,
    description: options.description,
    title: options.title,
  };
  const params = {tagId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.TAGS_DIRECTORY_TAG,
      params,
    },
  });
}


export async function putTagBlobs(
  context: RequestContext,
  tagId: string,
  options: RestOptions.PutTagBlobs,
): Promise<RestResponsesRaw.PutTagBlobs> {
  const body = {
    blobs: options.blobs.map((x) => {
      const value = (Buffer.isBuffer(x.value)) ? x.value.toString('base64') : x.value;
      return {
        storage_id: x.storageId,
        storage_type: x.storageType,
        value,
      };
    }),
    channel_id: options.channelId,
    guild_id: options.guildId,
    user_id: options.userId,
  };
  const params = {tagId};
  return request(context, {
    body,
    route: {
      method: HTTPMethods.PUT,
      path: Api.TAG_BLOBS,
      params,
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
    safe: options.safe,
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
): Promise<RestResponsesRaw.SearchDuckDuckGoImages> {
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
    max_results: options.max_results,
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
    max_results: options.max_results,
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
    max_results: options.maxResults,
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
    safe: options.safe,
    stdin: options.stdin,
    urls: options.urls,
    version: options.version,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_CODE_RUN,
    },
  });
}


export async function utilitiesFetchMedia(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchMedia,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    do_not_error: options.doNotError,
    download_quality: options.downloadQuality,
    locale: options.locale,
    max_file_size: maxFileSize,
    media_format: options.mediaFormat,
    media_position: options.mediaPosition,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
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
    strip_html: options.stripHtml,
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


export async function utilitiesLocations(
  context: RequestContext,
  options: RestOptions.UtilitiesLocations,
): Promise<RestResponsesRaw.UtilitiesLocations> {
  const query = {
    limit: options.limit,
    query: options.query,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_LOCATIONS,
    },
  });
}


export async function utilitiesMediascript(
  context: RequestContext,
  options: RestOptions.UtilitiesMediascript,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    code: options.code,
    max_file_size: maxFileSize,
    max_file_size_strict: options.maxFileSizeStrict,
    ml_diffusion_model: options.mlDiffusionModel,
    safe: options.safe,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
  };
  return request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_MEDIASCRIPT,
    },
  });
}


export async function utilitiesMLEdit(
  context: RequestContext,
  options: RestOptions.UtilitiesMLEdit,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    expand: options.expand,
    do_not_error: options.doNotError,
    max_file_size: maxFileSize,
    model: options.model,
    query: options.query,
    safe: true,
    seed: options.seed,
    steps: options.steps,
    strength: options.strength,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    urls: options.urls,
  };
  const response = await request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_ML_EDIT,
    },
  });
  return response;
}


export async function utilitiesMLImagine(
  context: RequestContext,
  options: RestOptions.UtilitiesMLImagine,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    do_not_error: options.doNotError,
    max_file_size: maxFileSize,
    model: options.model,
    query: options.query,
    safe: true,
    seed: options.seed,
    steps: options.steps,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
  };
  const response = await request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_ML_IMAGINE,
    },
  });
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
    query,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_ML_INTERROGATE,
    },
  });
}


export async function utilitiesMLMashup(
  context: RequestContext,
  options: RestOptions.UtilitiesMLMashup,
): Promise<RestResponsesRaw.JobResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const body = {
    do_not_error: options.doNotError,
    model: options.model,
    max_file_size: maxFileSize,
    safe: true,
    seed: options.seed,
    steps: options.steps,
    strength: options.strength,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    urls: options.urls,
  };
  const response = await request(context, {
    body,
    file: options.file,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_ML_MASHUP,
    },
  });
  return response;
}


export async function utilitiesProxyRequest(
  context: RequestContext,
  options: RestOptions.UtilitiesProxyRequest,
): Promise<RestResponsesRaw.UtilitiesProxyRequest> {
  const body = {
    data: options.data,
    data_json: options.dataJSON,
    headers: options.headers,
    method: options.method,
    query: options.query,
    url: options.url,
  };
  return request(context, {
    body,
    files: options.files,
    route: {
      method: HTTPMethods.POST,
      path: Api.UTILITIES_PROXY_REQUEST,
    },
  });
}


export async function utilitiesQrCreate(
  context: RequestContext,
  options: RestOptions.UtilitiesQrCreate,
): Promise<RestResponsesRaw.FileResponse> {
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    margin: options.margin,
    max_file_size: maxFileSize,
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
  const maxFileSize = getDefaultMaxFileSize(context, options);
  const query = {
    // the api defaults to dark mode, so `-lightmode` did nothing without this
    darkmode: options.darkmode,
    height: options.height,
    max_file_size: maxFileSize,
    safe: options.safe,
    timeout: options.timeout,
    upload: options.upload,
    upload_expires_in: options.uploadExpiresIn,
    url: options.url,
    wait: options.wait,
    width: options.width,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_SCREENSHOT,
    },
  });
}


export async function utilitiesWeather(
  context: RequestContext,
  options: RestOptions.UtilitiesWeather,
): Promise<RestResponsesRaw.UtilitiesWeather> {
  const query = {
    query: options.query,
    units: options.units,
  };
  return request(context, {
    query,
    route: {
      method: HTTPMethods.GET,
      path: Api.UTILITIES_WEATHER,
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
