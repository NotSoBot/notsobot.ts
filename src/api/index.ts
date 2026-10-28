import { Collections, Command } from 'detritus-client';
import { Response } from 'detritus-rest';
import { HTTPMethods } from 'detritus-rest/lib/constants';

import GuildSettingsStore from '../stores/guildsettings';
import ServerSettingsStore from '../stores/serversettings';
import UserStore from '../stores/users';
import UserSettingsStore from '../stores/usersettings';

import * as Endpoints from './endpoints';
import * as raw from './raw';
import { RequestContext } from './raw';
import { GoogleSearchImageResult } from './structures/googlesearchimageresult';
import {
  GuildSettings,
  GuildSettingsLogger,
  GuildSettingsPrefix,
} from './structures/guildsettings';
import { ServerSettings } from './structures/serversettings';
import { UserFull } from './structures/user';
import { RestOptions, RestResponses, RestResponsesRaw } from './types';

export * from './errors';
export { request } from './raw';
export { Endpoints, RequestContext, RestOptions, RestResponses, RestResponsesRaw, raw };


export async function addGuildFeature(
  context: RequestContext,
  guildId: string,
  feature: string,
) {
  return raw.addGuildFeature(context, guildId, feature);
}


export async function createGuildLogger(
  context: RequestContext,
  guildId: string,
  options: RestOptions.CreateGuildLogger,
): Promise<RestResponses.CreateGuildLogger> {
  const data = await raw.createGuildLogger(context, guildId, options);
  const collection = new Collections.BaseCollection<string, GuildSettingsLogger>();
  for (let raw of data) {
    const item = new GuildSettingsLogger(raw);
    collection.set(item.key, item);
  }
  if (GuildSettingsStore.has(guildId)) {
    const settings = GuildSettingsStore.get(guildId)!;
    settings.merge({loggers: data});
  }
  return collection;
}


export async function createGuildPrefix(
  context: RequestContext,
  guildId: string,
  prefix: string,
): Promise<RestResponses.CreateGuildPrefix> {
  const data = await raw.createGuildPrefix(context, guildId, prefix);
  const collection = new Collections.BaseCollection<string, GuildSettingsPrefix>();
  for (let raw of data) {
    const item = new GuildSettingsPrefix(raw);
    collection.set(item.prefix, item);
  }
  if (GuildSettingsStore.has(guildId)) {
    const settings = GuildSettingsStore.get(guildId)!;
    settings.merge({prefixes: data});
  }
  return collection;
}


export async function createReminder(
  context: RequestContext,
  options: RestOptions.CreateReminder,
) {
  return raw.createReminder(context, options);
}


export async function createReport(
  context: RequestContext,
  options: RestOptions.CreateReport,
) {
  return raw.createReport(context, options);
}


export async function createReportMessage(
  context: RequestContext,
  reportId: string,
  options: RestOptions.CreateReportMessage,
) {
  return raw.createReportMessage(context, reportId, options);
}


export async function createTagUse(
  context: RequestContext,
  tagId: string,
  options: RestOptions.CreateTagUse,
) {
  return raw.createTagUse(context, tagId, options);
}


export async function createTagsDirectoryTagVerification(
  context: RequestContext,
  tagId: string,
) {
  return raw.createTagsDirectoryTagVerification(context, tagId);
}


export async function createUserCommand(
  context: RequestContext,
  userId: string,
  command: string,
  options: RestOptions.CreateUserCommand,
) {
  return raw.createUserCommand(context, userId, command, options);
}


export async function createVoiceClone(
  context: RequestContext,
  options: RestOptions.CreateVoiceClone,
) {
  return raw.createVoiceClone(context, options);
}


export async function deleteChannel(
  context: RequestContext,
  channelId: string,
  options: RestOptions.DeleteChannel,
) {
  return raw.deleteChannel(context, channelId, options);
}


export async function deleteCommandsResponses(
  context: RequestContext,
  options: RestOptions.DeleteCommandsResponses,
): Promise<RestResponses.DeleteCommandsResponses> {
  return raw.deleteCommandsResponses(context, options);
}

export async function deleteFile(
  context: RequestContext,
  fileId: string,
) {
  return raw.deleteFile(context, fileId);
}


export async function deleteGuildLogger(
  context: RequestContext,
  guildId: string,
  options: RestOptions.DeleteGuildLogger,
): Promise<RestResponses.DeleteGuildLogger> {
  const data = await raw.deleteGuildLogger(context, guildId, options);
  const collection = new Collections.BaseCollection<string, GuildSettingsLogger>();
  // older api versions answered with the number 204 instead of the remaining loggers
  if (!Array.isArray(data)) {
    if (GuildSettingsStore.has(guildId)) {
      const settings = GuildSettingsStore.get(guildId)!;
      for (let [key, logger] of settings.loggers) {
        if (logger.channelId === options.channelId && logger.type === options.type) {
          settings.loggers.delete(key);
        }
      }
    }
    return collection;
  }
  for (let raw of data) {
    const item = new GuildSettingsLogger(raw);
    collection.set(item.key, item);
  }
  if (GuildSettingsStore.has(guildId)) {
    const settings = GuildSettingsStore.get(guildId)!;
    settings.merge({loggers: data});
  }
  return collection;
}


export async function deleteGuildPrefix(
  context: RequestContext,
  guildId: string,
  prefix: string,
): Promise<RestResponses.DeleteGuildPrefix> {
  const data = await raw.deleteGuildPrefix(context, guildId, prefix);
  const collection = new Collections.BaseCollection<string, GuildSettingsPrefix>();
  for (let raw of data) {
    const item = new GuildSettingsPrefix(raw);
    collection.set(item.prefix, item);
  }
  if (GuildSettingsStore.has(guildId)) {
    const settings = GuildSettingsStore.get(guildId)!;
    settings.merge({prefixes: data});
  }
  return collection;
}


export async function deleteReminder(
  context: RequestContext,
  reminderId: string,
) {
  return raw.deleteReminder(context, reminderId);
}


export async function editReminder(
  context: RequestContext,
  reminderId: string,
  options: RestOptions.EditReminder,
) {
  return raw.editReminder(context, reminderId, options);
}


export async function moveReminderToDms(
  context: RequestContext,
  reminderId: string,
) {
  return raw.moveReminderToDms(context, reminderId);
}


export async function deleteReminderPositional(
  context: RequestContext,
  userId: string,
  position: number | string,
) {
  return raw.deleteReminderPositional(context, userId, position);
}


export async function createUserLLMMemory(
  context: RequestContext,
  userId: string,
  options: RestOptions.CreateUserLLMMemory,
) {
  return raw.createUserLLMMemory(context, userId, options);
}


export async function deleteUserLLMMemories(
  context: RequestContext,
  userId: string,
) {
  return raw.deleteUserLLMMemories(context, userId);
}


export async function deleteUserLLMMemory(
  context: RequestContext,
  userId: string,
  position: number | string,
) {
  return raw.deleteUserLLMMemory(context, userId, position);
}


export async function editUserLLMMemory(
  context: RequestContext,
  userId: string,
  position: number | string,
  options: RestOptions.EditUserLLMMemory,
) {
  return raw.editUserLLMMemory(context, userId, position, options);
}


export async function fetchUserLLMMemories(
  context: RequestContext,
  userId: string,
) {
  return raw.fetchUserLLMMemories(context, userId);
}


export async function fetchUserPremiumServers(
  context: RequestContext,
  userId: string,
) {
  return raw.fetchUserPremiumServers(context, userId);
}


export async function putUserPremiumServer(
  context: RequestContext,
  userId: string,
  serverId: string,
) {
  return raw.putUserPremiumServer(context, userId, serverId);
}


export async function deleteUserPremiumServer(
  context: RequestContext,
  userId: string,
  serverId: string,
) {
  return raw.deleteUserPremiumServer(context, userId, serverId);
}


export async function fetchPremiumServers(
  context: RequestContext,
) {
  return raw.fetchPremiumServers(context);
}


export async function fetchPremiumUsers(
  context: RequestContext,
) {
  return raw.fetchPremiumUsers(context);
}


export async function deleteTag(
  context: RequestContext,
  options: RestOptions.DeleteTagSearch,
) {
  return raw.deleteTag(context, options);
}


export async function deleteTagsDirectoryTagVerification(
  context: RequestContext,
  tagId: string,
) {
  return raw.deleteTagsDirectoryTagVerification(context, tagId);
}


export async function deleteTagsServer(
  context: RequestContext,
  serverId: string,
  options: RestOptions.DeleteTags = {},
) {
  return raw.deleteTagsServer(context, serverId, options);
}


export async function deleteTagVariable(
  context: RequestContext,
  tagId: string,
  storageType: number,
  storageId: string,
  options: RestOptions.DeleteTagVariable,
) {
  return raw.deleteTagVariable(context, tagId, storageType, storageId, options);
}


export async function deleteVoice(
  context: RequestContext,
  voiceId: string,
) {
  return raw.deleteVoice(context, voiceId);
}


// the rule routes return the server's rules, put them on its cached settings (the redis event does the same)
async function mergeGuildRules(
  context: RequestContext,
  guildId: string,
  rules: Array<RestResponsesRaw.GuildRule>,
): Promise<GuildSettings> {
  let settings = GuildSettingsStore.get(guildId);
  if (settings) {
    settings.merge({rules});
  } else {
    settings = await GuildSettingsStore.fetch(context, guildId) || new GuildSettings({id: guildId, rules});
  }
  return settings;
}


export async function clearGuildRules(
  context: RequestContext,
  guildId: string,
): Promise<RestResponses.DeleteGuildRules> {
  const data = await raw.clearGuildRules(context, guildId);
  return mergeGuildRules(context, guildId, data);
}


export async function deleteGuildRules(
  context: RequestContext,
  guildId: string,
  ruleIds: Array<string>,
): Promise<RestResponses.DeleteGuildRules> {
  const data = await raw.deleteGuildRules(context, guildId, ruleIds);
  return mergeGuildRules(context, guildId, data);
}


export async function editGuildRule(
  context: RequestContext,
  guildId: string,
  ruleId: string,
  options: RestOptions.EditGuildRule,
): Promise<RestResponses.EditGuildRule> {
  const data = await raw.editGuildRule(context, guildId, ruleId, options);
  return mergeGuildRules(context, guildId, data);
}


export async function putGuildRules(
  context: RequestContext,
  guildId: string,
  rules: Array<RestOptions.PutGuildRule>,
): Promise<RestResponses.PutGuildRules> {
  const data = await raw.putGuildRules(context, guildId, rules);
  return mergeGuildRules(context, guildId, data);
}


export async function editGuildSettings(
  context: RequestContext,
  guildId: string,
  options: RestOptions.EditGuildSettings = {},
): Promise<RestResponses.EditGuildSettings> {
  const data = await raw.editGuildSettings(context, guildId, options);
  let settings: GuildSettings;
  if (GuildSettingsStore.has(guildId)) {
    settings = GuildSettingsStore.get(guildId)!;
    settings.merge(data);
  } else {
    settings = new GuildSettings(data);
    GuildSettingsStore.set(settings.id, settings);
  }
  return settings;
}


export async function editServerSettings(
  context: RequestContext,
  serverId: string,
  options: RestOptions.EditServerSettings = {},
): Promise<RestResponses.EditServerSettings> {
  const data = await raw.editServerSettings(context, serverId, options);
  let settings: ServerSettings;
  if (ServerSettingsStore.has(serverId)) {
    settings = ServerSettingsStore.get(serverId)!;
    settings.merge(data);
  } else {
    settings = new ServerSettings(data);
    ServerSettingsStore.set(settings.id, settings);
  }
  return settings;
}


export async function editTag(
  context: RequestContext,
  tagId: string,
  options: RestOptions.EditTag,
) {
  return raw.editTag(context, tagId, options);
}


export async function editTagsDirectoryTag(
  context: RequestContext,
  tagId: string,
  options: RestOptions.EditTagsDirectoryTag,
) {
  return raw.editTagsDirectoryTag(context, tagId, options);
}


export async function editUser(
  context: RequestContext,
  userId: string,
  options: RestOptions.EditUser,
): Promise<RestResponses.EditUser> {
  const data = await raw.editUser(context, userId, options);
  let user: UserFull;
  if (UserStore.has(userId)) {
    user = UserStore.get(userId)!;
    user.merge(data);
  } else {
    user = new UserFull(data);
    UserStore.set(user.id, user);
  }
  return user;
}


export async function editUserSettings(
  context: RequestContext,
  userId: string,
  options: RestOptions.EditUserSettings,
) {
  const data = await raw.editUserSettings(context, userId, options);
  if (UserSettingsStore.has(userId)) {
    UserSettingsStore.insert(userId, data);
  }
  return data;
}


export async function fetchCommandsResponses(
  context: RequestContext,
  options: RestOptions.FetchCommandsResponses = {},
) {
  return raw.fetchCommandsResponses(context, options);
}


export async function fetchCommandsUsage(
  context: RequestContext,
  options: RestOptions.FetchCommandsUsage,
) {
  return raw.fetchCommandsUsage(context, options);
}


export async function fetchFile(
  context: RequestContext,
  fileId: string,
) {
  return raw.fetchFile(context, fileId);
}


export async function fetchFileVanity(
  context: RequestContext,
  vanity: string,
) {
  return raw.fetchFileVanity(context, vanity);
}


export async function fetchGuildSettings(
  context: RequestContext,
  guildId: string,
): Promise<RestResponses.FetchGuildSettings> {
  const data = await raw.fetchGuildSettings(context, guildId);
  let settings: GuildSettings;
  if (GuildSettingsStore.has(guildId)) {
    settings = GuildSettingsStore.get(guildId)!;
    settings.merge(data);
  } else {
    settings = new GuildSettings(data);
    GuildSettingsStore.set(settings.id, settings);
  }
  return settings;
}


export async function fetchGuildTagsCommands(
  context: RequestContext,
  guildId: string,
) {
  return raw.fetchGuildTagsCommands(context, guildId);
}


// stops it if it's queued or running, then deletes it (and its temp file)
export async function deleteJob(
  context: RequestContext,
  jobId: string,
) {
  return raw.deleteJob(context, jobId);
}


export async function fetchJob(
  context: RequestContext,
  jobId: string,
) {
  return raw.fetchJob(context, jobId);
}


export async function fetchReminders(
  context: RequestContext,
  options: RestOptions.FetchReminders,
) {
  return raw.fetchReminders(context, options);
}


export async function fetchMusicNodes(context: RequestContext) {
  return raw.fetchMusicNodes(context);
}


export async function searchMusic(context: RequestContext, query: string) {
  return raw.searchMusic(context, query);
}


export async function fetchGuildMusic(context: RequestContext, guildId: string) {
  return raw.fetchGuildMusic(context, guildId);
}


export async function editGuildMusic(context: RequestContext, guildId: string, options: RestOptions.EditGuildMusic) {
  return raw.editGuildMusic(context, guildId, options);
}


export async function fetchGuildMusicHistory(
  context: RequestContext,
  guildId: string,
  options: RestOptions.FetchGuildMusicHistory = {},
) {
  return raw.fetchGuildMusicHistory(context, guildId, options);
}


export async function fetchGuildMusicStats(
  context: RequestContext,
  guildId: string,
  options: RestOptions.FetchGuildMusicStats = {},
) {
  return raw.fetchGuildMusicStats(context, guildId, options);
}


export async function deleteGuildMusic(context: RequestContext, guildId: string) {
  return raw.deleteGuildMusic(context, guildId);
}


export async function fetchMusicSessions(context: RequestContext, options: RestOptions.FetchMusicSessions) {
  return raw.fetchMusicSessions(context, options);
}


export async function putGuildMusicSession(context: RequestContext, guildId: string, options: RestOptions.PutGuildMusicSession) {
  return raw.putGuildMusicSession(context, guildId, options);
}


export async function editGuildMusicSession(context: RequestContext, guildId: string, options: RestOptions.EditGuildMusicSession) {
  return raw.editGuildMusicSession(context, guildId, options);
}


export async function editGuildMusicSound(context: RequestContext, guildId: string, options: RestOptions.EditGuildMusicSound) {
  return raw.editGuildMusicSound(context, guildId, options);
}


export async function postGuildMusicNext(context: RequestContext, guildId: string, options: RestOptions.PostGuildMusicNext) {
  return raw.postGuildMusicNext(context, guildId, options);
}


export async function deleteGuildMusicSession(context: RequestContext, guildId: string) {
  return raw.deleteGuildMusicSession(context, guildId);
}


export async function putGuildMusicQueue(
  context: RequestContext,
  guildId: string,
  options: RestOptions.PutGuildMusicQueue,
) {
  return raw.putGuildMusicQueue(context, guildId, options);
}


export async function putGuildMusicQueueBatch(
  context: RequestContext,
  guildId: string,
  options: RestOptions.PutGuildMusicQueueBatch,
) {
  return raw.putGuildMusicQueueBatch(context, guildId, options);
}


export async function editGuildMusicQueueItem(
  context: RequestContext,
  guildId: string,
  itemId: string,
  options: RestOptions.EditGuildMusicQueueItem,
) {
  return raw.editGuildMusicQueueItem(context, guildId, itemId, options);
}


export async function deleteGuildMusicQueueItem(context: RequestContext, guildId: string, itemId: string) {
  return raw.deleteGuildMusicQueueItem(context, guildId, itemId);
}


export async function deleteGuildMusicQueue(
  context: RequestContext,
  guildId: string,
  options: RestOptions.DeleteGuildMusicQueue = {},
) {
  return raw.deleteGuildMusicQueue(context, guildId, options);
}


export async function putGuildTimedBans(
  context: RequestContext,
  guildId: string,
  options: RestOptions.PutGuildTimedBans,
) {
  return raw.putGuildTimedBans(context, guildId, options);
}


export async function deleteGuildTimedBan(
  context: RequestContext,
  guildId: string,
  userId: string,
  options: RestOptions.DeleteGuildTimedBan = {},
) {
  return raw.deleteGuildTimedBan(context, guildId, userId, options);
}


export async function deleteGuildTimedBans(
  context: RequestContext,
  guildId: string,
  options: RestOptions.DeleteGuildTimedBans,
) {
  return raw.deleteGuildTimedBans(context, guildId, options);
}


export async function fetchGuildTimedBans(
  context: RequestContext,
  guildId: string,
) {
  return raw.fetchGuildTimedBans(context, guildId);
}


export async function putGuildWarnings(
  context: RequestContext,
  guildId: string,
  options: RestOptions.PutGuildWarnings,
) {
  return raw.putGuildWarnings(context, guildId, options);
}


export async function fetchGuildWarnings(
  context: RequestContext,
  guildId: string,
  options: RestOptions.FetchGuildWarnings = {},
) {
  return raw.fetchGuildWarnings(context, guildId, options);
}


export async function deleteGuildWarning(
  context: RequestContext,
  guildId: string,
  warningId: string,
) {
  return raw.deleteGuildWarning(context, guildId, warningId);
}


export async function deleteGuildWarnings(
  context: RequestContext,
  guildId: string,
  options: RestOptions.DeleteGuildWarnings,
) {
  return raw.deleteGuildWarnings(context, guildId, options);
}


export async function createGuildReport(
  context: RequestContext,
  guildId: string,
  options: RestOptions.CreateGuildReport,
) {
  return raw.createGuildReport(context, guildId, options);
}


export async function fetchGuildReports(
  context: RequestContext,
  guildId: string,
  options: RestOptions.FetchGuildReports = {},
) {
  return raw.fetchGuildReports(context, guildId, options);
}


export async function putGuildReportQuote(
  context: RequestContext,
  guildId: string,
  reportId: string,
  options: RestOptions.MediaICreateQuote,
) {
  return raw.putGuildReportQuote(context, guildId, reportId, options);
}


export async function putGuildReportReporterMuted(
  context: RequestContext,
  guildId: string,
  reportId: string,
  options: {muted: boolean, userId: string},
) {
  return raw.putGuildReportReporterMuted(context, guildId, reportId, options);
}


export async function fetchGuildReportQuote(
  context: RequestContext,
  guildId: string,
  reportId: string,
) {
  return raw.fetchGuildReportQuote(context, guildId, reportId);
}


export async function putGuildReportMember(
  context: RequestContext,
  guildId: string,
  reportId: string,
  options: RestOptions.MediaICreateQuoteMember,
) {
  return raw.putGuildReportMember(context, guildId, reportId, options);
}


export async function createGuildReportMessage(
  context: RequestContext,
  guildId: string,
  reportId: string,
  options: RestOptions.CreateGuildReportMessage,
) {
  return raw.createGuildReportMessage(context, guildId, reportId, options);
}


export async function editGuildReport(
  context: RequestContext,
  guildId: string,
  reportId: string,
  options: RestOptions.EditGuildReport,
) {
  return raw.editGuildReport(context, guildId, reportId, options);
}


export async function editGuildReportLogMessages(
  context: RequestContext,
  guildId: string,
  reportId: string,
  options: RestOptions.EditGuildReportLogMessages,
) {
  return raw.editGuildReportLogMessages(context, guildId, reportId, options);
}


export async function fetchTimedBans(
  context: RequestContext,
  options: RestOptions.FetchTimedBans,
) {
  return raw.fetchTimedBans(context, options);
}


export async function fetchReminderPositional(
  context: RequestContext,
  userId: string,
  position: number | string,
) {
  return raw.fetchReminderPositional(context, userId, position);
}


export async function fetchReports(
  context: RequestContext,
  options: RestOptions.FetchReports = {},
) {
  return raw.fetchReports(context, options);
}


export async function fetchServerSettings(
  context: RequestContext,
  serverId: string,
): Promise<RestResponses.FetchServerSettings> {
  const data = await raw.fetchServerSettings(context, serverId);
  let settings: ServerSettings;
  if (ServerSettingsStore.has(serverId)) {
    settings = ServerSettingsStore.get(serverId)!;
    settings.merge(data);
  } else {
    settings = new ServerSettings(data);
    ServerSettingsStore.set(settings.id, settings);
  }
  return settings;
}


export async function fetchTag(
  context: RequestContext,
  options: RestOptions.FetchTagSearch,
) {
  return raw.fetchTag(context, options);
}


export async function fetchTagId(
  context: RequestContext,
  tagId: string,
) {
  return raw.fetchTagId(context, tagId);
}


export async function fetchTagBlobs(
  context: RequestContext,
  tagId: string,
  options: RestOptions.FetchTagBlobs,
) {
  return raw.fetchTagBlobs(context, tagId, options);
}


export async function fetchTagRandom(
  context: RequestContext,
  options: RestOptions.FetchTagSearchRandom = {},
) {
  return raw.fetchTagRandom(context, options);
}


export async function fetchTagStorage(
  context: RequestContext,
  tagId: string,
  options: RestOptions.FetchTagStorage = {},
) {
  return raw.fetchTagStorage(context, tagId, options);
}


export async function fetchTagsDirectory(
  context: RequestContext,
  options: RestOptions.FetchTagsDirectory = {},
) {
  return raw.fetchTagsDirectory(context, options);
}


export async function fetchTagsServer(
  context: RequestContext,
  guildId: string,
  options: RestOptions.FetchTags = {},
) {
  return raw.fetchTagsServer(context, guildId, options);
}


export async function postTagsImport(
  context: RequestContext,
  serverId: string,
  options: RestOptions.PostTagsImport,
) {
  return raw.postTagsImport(context, serverId, options);
}


export async function fetchTagsExport(
  context: RequestContext,
  serverId: string,
  options: RestOptions.FetchTagsExport = {},
) {
  return raw.fetchTagsExport(context, serverId, options);
}


export async function fetchTagVariable(
  context: RequestContext,
  tagId: string,
  storageType: number,
  storageId: string,
  options: RestOptions.FetchTagVariable,
) {
  return raw.fetchTagVariable(context, tagId, storageType, storageId, options);
}


export async function fetchTagVariables(
  context: RequestContext,
  tagId: string,
  options: RestOptions.FetchTagVariables,
) {
  return raw.fetchTagVariables(context, tagId, options);
}


export async function fetchUser(
  context: RequestContext,
  userId: string,
): Promise<RestResponses.FetchUser> {
  const data = await raw.fetchUser(context, userId);
  let user: UserFull;
  if (UserStore.has(userId)) {
    user = UserStore.get(userId)!;
    user.merge(data);
  } else {
    user = new UserFull(data);
    UserStore.set(user.id, user);
  }
  return user;
}


export async function fetchUserReminders(
  context: RequestContext,
  userId: string,
  options: RestOptions.FetchUserReminders = {},
) {
  return raw.fetchUserReminders(context, userId, options);
}


export async function fetchUserSettings(
  context: RequestContext,
  userId: string,
) {
  return raw.fetchUserSettings(context, userId);
}


export async function fetchUserTags(
  context: RequestContext,
  userId: string,
  options: RestOptions.FetchUserTags = {},
) {
  return raw.fetchUserTags(context, userId, options);
}


export async function fetchUserTagsCommands(
  context: RequestContext,
  userId: string,
) {
  return raw.fetchUserTagsCommands(context, userId);
}


export async function fetchUserVoices(
  context: RequestContext,
  userId: string,
) {
  return raw.fetchUserVoices(context, userId);
}


export async function funAsciiArtFromImage(
  context: RequestContext,
  options: RestOptions.FunAsciiArtFromImage,
) {
  return raw.funAsciiArtFromImage(context, options);
}


export async function funAsciiArtFromText(
  context: RequestContext,
  options: RestOptions.FunAsciiArtFromText,
) {
  return raw.funAsciiArtFromText(context, options);
}


export async function funTextToSpeech(
  context: RequestContext,
  options: RestOptions.FunTextToSpeech,
) {
  return raw.funTextToSpeech(context, options);
}


export async function generateTag(
  context: RequestContext,
  options: RestOptions.GenerateTag,
) {
  return raw.generateTag(context, options);
}


export async function googleContentVisionLabels(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionBase,
) {
  return raw.googleContentVisionLabels(context, options);
}


export async function googleContentVisionOCR(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionBase,
) {
  return raw.googleContentVisionOCR(context, options);
}


export async function googleContentVisionSafeSearch(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionBase,
) {
  return raw.googleContentVisionSafeSearch(context, options);
}


export async function googleContentVisionWebDetection(
  context: RequestContext,
  options: RestOptions.GoogleContentVisionBase,
) {
  return raw.googleContentVisionWebDetection(context, options);
}


export async function googleTranslate(
  context: RequestContext,
  options: RestOptions.GoogleTranslate,
) {
  return raw.googleTranslate(context, options);
}


export async function mediaACreateSong(
  context: RequestContext,
  options: RestOptions.MediaACreateSong,
) {
  return raw.mediaACreateSong(context, options);
}


export async function mediaAIVManipulationADHD(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationADHD,
) {
  return raw.mediaAIVManipulationADHD(context, options);
}


export async function mediaAIVManipulationAndroid(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationAndroid,
) {
  return raw.mediaAIVManipulationAndroid(context, options);
}


export async function mediaAIVManipulationAudioPutConcat(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationAudioPutBase,
) {
  return raw.mediaAIVManipulationAudioPutConcat(context, options);
}


export async function mediaAIVManipulationAudioPutMix(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationAudioPutBase,
) {
  return raw.mediaAIVManipulationAudioPutMix(context, options);
}


export async function mediaAIVManipulationAudioPutReplace(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationAudioPutBase,
) {
  return raw.mediaAIVManipulationAudioPutReplace(context, options);
}


export async function mediaAIVManipulationConcat(
  context: RequestContext,
  options: RestOptions.MediaBaseOptionsMultiple,
) {
  return raw.mediaAIVManipulationConcat(context, options);
}


export async function mediaAIVManipulationConvert(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationConvert,
) {
  return raw.mediaAIVManipulationConvert(context, options);
}


export async function mediaAIVManipulationFadeIn(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationFadeIn,
) {
  return raw.mediaAIVManipulationFadeIn(context, options);
}


export async function mediaAIVManipulationFadeOut(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationFadeOut,
) {
  return raw.mediaAIVManipulationFadeOut(context, options);
}


export async function mediaAIVManipulationExtractMedia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAIVManipulationExtractMedia(context, options);
}


export async function mediaAIVManipulationInterpolate(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationInterpolate,
) {
  return raw.mediaAIVManipulationInterpolate(context, options);
}


export async function mediaAIVManipulationJoin(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationJoin,
) {
  return raw.mediaAIVManipulationJoin(context, options);
}


export async function mediaAIVManipulationOverlay(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationOverlay,
) {
  return raw.mediaAIVManipulationOverlay(context, options);
}


export async function mediaAIVManipulationReverse(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationReverse,
) {
  return raw.mediaAIVManipulationReverse(context, options);
}


export async function mediaAIVManipulationSeeSaw(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAIVManipulationSeeSaw(context, options);
}


export async function mediaAIVManipulationShuffle(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationShuffle,
) {
  return raw.mediaAIVManipulationShuffle(context, options);
}


export async function mediaAIVManipulationSnip(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationSnip,
) {
  return raw.mediaAIVManipulationSnip(context, options);
}


export async function mediaAIVManipulationSpeed(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationSpeed,
) {
  return raw.mediaAIVManipulationSpeed(context, options);
}


export async function mediaAIVManipulationVeg(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationVeg,
) {
  return raw.mediaAIVManipulationVeg(context, options);
}


export async function mediaAIVManipulationWlmp(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationWlmp,
) {
  return raw.mediaAIVManipulationWlmp(context, options);
}


export async function mediaAIVToolsAnalyze(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAIVToolsAnalyze(context, options);
}


export async function mediaAIVToolsExif(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAIVToolsExif(context, options);
}


export async function mediaAVManipulationAudioBitcrush(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioBitcrush,
) {
  return raw.mediaAVManipulationAudioBitcrush(context, options);
}


export async function mediaAVManipulationAudioBoostBass(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVManipulationAudioBoostBass(context, options);
}


export async function mediaAVManipulationAudioChannelsCombine(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVManipulationAudioChannelsCombine(context, options);
}


export async function mediaAVManipulationAudioChannelsInvert(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVManipulationAudioChannelsInvert(context, options);
}


export async function mediaAVManipulationAudioCompress(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioCompress,
) {
  return raw.mediaAVManipulationAudioCompress(context, options);
}


export async function mediaAVManipulationAudioDestroy(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVManipulationAudioDestroy(context, options);
}


export async function mediaAVManipulationAudioEqualizer(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioEqualizer,
) {
  return raw.mediaAVManipulationAudioEqualizer(context, options);
}


export async function mediaAVManipulationAudioFlanger(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioFlanger,
) {
  return raw.mediaAVManipulationAudioFlanger(context, options);
}


export async function mediaAVManipulationAudioVocoder(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioVocoder,
) {
  return raw.mediaAVManipulationAudioVocoder(context, options);
}


export async function mediaAVManipulationAudioMultiPitch(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioMultiPitch,
) {
  return raw.mediaAVManipulationAudioMultiPitch(context, options);
}


export async function mediaAVManipulationAudioNormalize(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioNormalize,
) {
  return raw.mediaAVManipulationAudioNormalize(context, options);
}


export async function mediaAVManipulationAudioPaulstretch(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioPaulstretch,
) {
  return raw.mediaAVManipulationAudioPaulstretch(context, options);
}


export async function mediaAVManipulationAudioPitch(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioPitch,
) {
  return raw.mediaAVManipulationAudioPitch(context, options);
}


export async function mediaAVManipulationAudioDelay(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioDelay,
) {
  return raw.mediaAVManipulationAudioDelay(context, options);
}


export async function mediaAVManipulationAudioReverb(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioReverb,
) {
  return raw.mediaAVManipulationAudioReverb(context, options);
}


export async function mediaAVManipulationAudioReverse(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVManipulationAudioReverse(context, options);
}


export async function mediaAVManipulationAudioTremolo(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioTremolo,
) {
  return raw.mediaAVManipulationAudioTremolo(context, options);
}


export async function mediaAVManipulationAudioVibrato(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioVibrato,
) {
  return raw.mediaAVManipulationAudioVibrato(context, options);
}


export async function mediaAVManipulationAudioVolume(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationAudioVolume,
) {
  return raw.mediaAVManipulationAudioVolume(context, options);
}


export async function mediaAVManipulationSetBitRate(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationSetBitRate,
) {
  return raw.mediaAVManipulationSetBitRate(context, options);
}


export async function mediaAVManipulationStammer(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationStammer,
) {
  return raw.mediaAVManipulationStammer(context, options);
}


export async function mediaAVManipulationWaveform(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationWaveform,
) {
  return raw.mediaAVManipulationWaveform(context, options);
}


export async function mediaAVToolsExtractAudio(
  context: RequestContext,
  options: RestOptions.MediaAVToolsExtractAudio,
) {
  return raw.mediaAVToolsExtractAudio(context, options);
}


export async function mediaAVToolsIdentify(
  context: RequestContext,
  options: RestOptions.MediaAVToolsIdentify,
) {
  return raw.mediaAVToolsIdentify(context, options);
}


export async function mediaAVToolsTranscribe(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVToolsTranscribe(context, options);
}


export async function mediaICreateHacker(
  context: RequestContext,
  options: RestOptions.MediaICreateHacker,
) {
  return raw.mediaICreateHacker(context, options);
}


export async function mediaICreatePresidential(
  context: RequestContext,
  options: RestOptions.MediaICreatePresidential,
) {
  return raw.mediaICreatePresidential(context, options);
}


export async function mediaICreateRealfact(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
) {
  return raw.mediaICreateRealfact(context, options);
}


export async function mediaICreateRetrowave(
  context: RequestContext,
  options: RestOptions.MediaICreateRetrowave,
) {
  return raw.mediaICreateRetrowave(context, options);
}


export async function mediaICreateEinstein(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
) {
  return raw.mediaICreateEinstein(context, options);
}


export async function mediaICreateYacht(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
) {
  return raw.mediaICreateYacht(context, options);
}


export async function mediaICreateFoggyWindow(
  context: RequestContext,
  options: RestOptions.MediaICreateFoggyWindow,
) {
  return raw.mediaICreateFoggyWindow(context, options);
}


export async function mediaICreateNeon(
  context: RequestContext,
  options: RestOptions.MediaICreateTextLines,
) {
  return raw.mediaICreateNeon(context, options);
}


export async function mediaICreateSnowWriting(
  context: RequestContext,
  options: RestOptions.MediaICreateTextLines,
) {
  return raw.mediaICreateSnowWriting(context, options);
}


export async function mediaICreateSoup(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
) {
  return raw.mediaICreateSoup(context, options);
}


export async function mediaICreateTreeCarving(
  context: RequestContext,
  options: RestOptions.MediaICreateTextLines,
) {
  return raw.mediaICreateTreeCarving(context, options);
}


export async function mediaICreateWoodenSign(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
) {
  return raw.mediaICreateWoodenSign(context, options);
}


export async function mediaICreateSonic(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
) {
  return raw.mediaICreateSonic(context, options);
}


export async function mediaICreateThonkify(
  context: RequestContext,
  options: RestOptions.MediaICreateText,
) {
  return raw.mediaICreateThonkify(context, options);
}


export async function mediaICreateQuote(
  context: RequestContext,
  options: RestOptions.MediaICreateQuote,
) {
  return raw.mediaICreateQuote(context, options);
}


export async function mediaICreateTombstone(
  context: RequestContext,
  options: RestOptions.MediaICreateTombstone,
) {
  return raw.mediaICreateTombstone(context, options);
}


export async function mediaICreateWordcloud(
  context: RequestContext,
  options: RestOptions.MediaICreateWordcloud,
) {
  return raw.mediaICreateWordcloud(context, options);
}


export async function mediaICreateWordcloudBackground(
  context: RequestContext,
  options: RestOptions.MediaICreateWordcloudBackground,
) {
  return raw.mediaICreateWordcloudBackground(context, options);
}


export async function mediaIVManipulationAcid(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAcid,
) {
  return raw.mediaIVManipulationAcid(context, options);
}


export async function mediaIVManipulationArtistic(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationArtistic(context, options);
}


export async function mediaIVManipulationAscii(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAscii,
) {
  return raw.mediaIVManipulationAscii(context, options);
}


export async function mediaIVManipulationBackgroundRemove(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationBackgroundRemoveOptions,
) {
  return raw.mediaIVManipulationBackgroundRemove(context, options);
}


export async function mediaIVManipulationColorRemove(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationColorRemove,
) {
  return raw.mediaIVManipulationColorRemove(context, options);
}


export async function mediaIVManipulationBill(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationBill(context, options);
}


export async function mediaIVManipulationBlur(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationBlur,
) {
  return raw.mediaIVManipulationBlur(context, options);
}


export async function mediaIVManipulationBlurple(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationBlurple(context, options);
}


export async function mediaIVManipulationBounce(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationBounce,
) {
  return raw.mediaIVManipulationBounce(context, options);
}


export async function mediaIVManipulationBurn(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationBurn(context, options);
}


export async function mediaIVManipulationCaption(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCaption,
) {
  return raw.mediaIVManipulationCaption(context, options);
}


export async function mediaIVManipulationCartoon(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCartoon,
) {
  return raw.mediaIVManipulationCartoon(context, options);
}


export async function mediaIVManipulationCharcoal(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCharcoal,
) {
  return raw.mediaIVManipulationCharcoal(context, options);
}


export async function mediaIVManipulationCharcoalAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCharcoal,
) {
  return raw.mediaIVManipulationCharcoalAnimated(context, options);
}


export async function mediaIVManipulationCircle(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCircle,
) {
  return raw.mediaIVManipulationCircle(context, options);
}


export async function mediaIVManipulationCrop(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCrop,
) {
  return raw.mediaIVManipulationCrop(context, options);
}


export async function mediaIVManipulationCropAuto(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationCropAuto(context, options);
}


export async function mediaIVManipulationCropCircle(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationCropCircle(context, options);
}


export async function mediaIVManipulationCropFace(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCropFace,
) {
  return raw.mediaIVManipulationCropFace(context, options);
}


export async function mediaIVManipulationCropTriangle(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationCropTriangle(context, options);
}


export async function mediaIVManipulationCropTwitterHex(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationCropTwitterHex(context, options);
}


export async function mediaIVManipulationDance(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDance,
) {
  return raw.mediaIVManipulationDance(context, options);
}


export async function mediaIVManipulationDatamosh(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDatamosh,
) {
  return raw.mediaIVManipulationDatamosh(context, options);
}


export async function mediaIVManipulationDeepfry(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDeepfry,
) {
  return raw.mediaIVManipulationDeepfry(context, options);
}


export async function mediaIVManipulationDemotivate(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDemotivate,
) {
  return raw.mediaIVManipulationDemotivate(context, options);
}


export async function mediaIVManipulationDerain(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationDerain(context, options);
}


export async function mediaIVManipulationDetunnel(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationTunnel,
) {
  return raw.mediaIVManipulationDetunnel(context, options);
}


export async function mediaIVManipulationDice(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDice,
) {
  return raw.mediaIVManipulationDice(context, options);
}


export async function mediaIVManipulationDistort(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDistort,
) {
  return raw.mediaIVManipulationDistort(context, options);
}


export async function mediaIVManipulationDrawFaces(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationDrawFaces(context, options);
}


export async function mediaIVManipulationEdgeDetect(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEdgeDetect,
) {
  return raw.mediaIVManipulationEdgeDetect(context, options);
}


export async function mediaIVManipulationEmboss(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEmboss,
) {
  return raw.mediaIVManipulationEmboss(context, options);
}


export async function mediaIVManipulationEmojiMosaic(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEmojiMosaic,
) {
  return raw.mediaIVManipulationEmojiMosaic(context, options);
}


export async function mediaIVManipulationExo(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationExo,
) {
  return raw.mediaIVManipulationExo(context, options);
}


export async function mediaIVManipulationExplode(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationExplode,
) {
  return raw.mediaIVManipulationExplode(context, options);
}


export async function mediaIVManipulationExplodeAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationExplode,
) {
  return raw.mediaIVManipulationExplodeAnimated(context, options);
}


export async function mediaIVManipulationEyes(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEyes,
) {
  return raw.mediaIVManipulationEyes(context, options);
}


export async function mediaIVManipulationFaceAlien(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFaceAlien(context, options);
}


export async function mediaIVManipulationFaceAnime(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceAnime,
) {
  return raw.mediaIVManipulationFaceAnime(context, options);
}


export async function mediaIVManipulationFaceClown(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFaceClown(context, options);
}


export async function mediaIVManipulationFaceFat(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFaceFat(context, options);
}


export async function mediaIVManipulationFaceForehead(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceForehead,
) {
  return raw.mediaIVManipulationFaceForehead(context, options);
}


export async function mediaIVManipulationFaceFeaturesExpressionMood(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceFeaturesExpressionMood,
) {
  return raw.mediaIVManipulationFaceFeaturesExpressionMood(context, options);
}


export async function mediaIVManipulationFaceFeaturesSwap(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceFeaturesSwap,
) {
  return raw.mediaIVManipulationFaceFeaturesSwap(context, options);
}


export async function mediaIVManipulationFaceHalloweenHat(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceHalloweenHat,
) {
  return raw.mediaIVManipulationFaceHalloweenHat(context, options);
}


export async function mediaIVManipulationFaceJoy(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFaceJoy(context, options);
}


export async function mediaIVManipulationFaceKnight(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFaceKnight(context, options);
}


export async function mediaIVManipulationFaceLenin(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFaceLenin(context, options);
}


export async function mediaIVManipulationFaceMonaLisa(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFaceMonaLisa(context, options);
}


export async function mediaIVManipulationFaceMountRushmore(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFaceMountRushmore(context, options);
}


export async function mediaIVManipulationFaceSwap(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceSwap,
) {
  return raw.mediaIVManipulationFaceSwap(context, options);
}


export async function mediaIVManipulationFaceSwapBuscemi(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceSwapPreset,
) {
  return raw.mediaIVManipulationFaceSwapBuscemi(context, options);
}


export async function mediaIVManipulationFaceSwapChad(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceSwapPreset,
) {
  return raw.mediaIVManipulationFaceSwapChad(context, options);
}


export async function mediaIVManipulationFaceSwapKirk(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceSwapPreset,
) {
  return raw.mediaIVManipulationFaceSwapKirk(context, options);
}


export async function mediaIVManipulationFaceXmasCap(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationFaceXmasCap,
) {
  return raw.mediaIVManipulationFaceXmasCap(context, options);
}


export async function mediaIVManipulationFisheye(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFisheye(context, options);
}


export async function mediaIVManipulationFlash(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
) {
  return raw.mediaIVManipulationFlash(context, options);
}


export async function mediaIVManipulationFlip(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFlip(context, options);
}


export async function mediaIVManipulationFlop(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationFlop(context, options);
}


export async function mediaIVManipulationGlass(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationGlass(context, options);
}


export async function mediaIVManipulationGlitch(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlitch,
) {
  return raw.mediaIVManipulationGlitch(context, options);
}


export async function mediaIVManipulationGlitchAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlitch,
) {
  return raw.mediaIVManipulationGlitchAnimated(context, options);
}


export async function mediaIVManipulationGlobe(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlobe,
) {
  return raw.mediaIVManipulationGlobe(context, options);
}


export async function mediaIVManipulationGlow(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlow,
) {
  return raw.mediaIVManipulationGlow(context, options);
}


export async function mediaIVManipulationGold(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationGold(context, options);
}


export async function mediaIVManipulationGradientMap(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGradientMap,
) {
  return raw.mediaIVManipulationGradientMap(context, options);
}


export async function mediaIVManipulationGrain(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGrain,
) {
  return raw.mediaIVManipulationGrain(context, options);
}


export async function mediaIVManipulationGrayscale(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationGrayscale(context, options);
}


export async function mediaIVManipulationHidden(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHidden,
) {
  return raw.mediaIVManipulationHidden(context, options);
}


export async function mediaIVManipulationHueCurveRGBA(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueCurveRGBA,
) {
  return raw.mediaIVManipulationHueCurveRGBA(context, options);
}


export async function mediaIVManipulationHueShiftCCS(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftCCS,
) {
  return raw.mediaIVManipulationHueShiftCCS(context, options);
}


export async function mediaIVManipulationHueShiftYIQ(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftYIQ,
) {
  return raw.mediaIVManipulationHueShiftYIQ(context, options);
}


export async function mediaIVManipulationHueShiftHSL(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftHSL,
) {
  return raw.mediaIVManipulationHueShiftHSL(context, options);
}


export async function mediaIVManipulationHueShiftHSV(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftHSV,
) {
  return raw.mediaIVManipulationHueShiftHSV(context, options);
}


export async function mediaIVManipulationHueShiftHSVFFMPEG(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftHSV,
) {
  return raw.mediaIVManipulationHueShiftHSVFFMPEG(context, options);
}


export async function mediaIVManipulationHueShiftRGB(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationHueShiftRGB,
) {
  return raw.mediaIVManipulationHueShiftRGB(context, options);
}


export async function mediaIVManipulationImplode(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationImplode,
) {
  return raw.mediaIVManipulationImplode(context, options);
}


export async function mediaIVManipulationImplodeAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationImplode,
) {
  return raw.mediaIVManipulationImplodeAnimated(context, options);
}


export async function mediaIVManipulationInOut(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
) {
  return raw.mediaIVManipulationInOut(context, options);
}


export async function mediaIVManipulationInstantCamera(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationInstantCamera,
) {
  return raw.mediaIVManipulationInstantCamera(context, options);
}


export async function mediaIVManipulationInvert(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationInvert(context, options);
}


export async function mediaIVManipulationInvertLAB(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationInvertLAB,
) {
  return raw.mediaIVManipulationInvertLAB(context, options);
}


export async function mediaIVManipulationInvertRGBA(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationInvertRGBA,
) {
  return raw.mediaIVManipulationInvertRGBA(context, options);
}


export async function mediaIVManipulationJPEG(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationJPEG,
) {
  return raw.mediaIVManipulationJPEG(context, options);
}


export async function mediaIVManipulationLabelsAnalysis(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationLabelsAnalysis(context, options);
}


export async function mediaIVManipulationLabelsExcuse(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationLabelsExcuse(context, options);
}


export async function mediaIVManipulationLabelsIFunny(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationLabelsIFunny(context, options);
}


export async function mediaIVManipulationLabelsKirby(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationLabelsKirby(context, options);
}


export async function mediaIVManipulationLabelsPerfection(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationLabelsPerfection(context, options);
}


export async function mediaIVManipulationLabelsTriggered2(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationLabelsTriggered2(context, options);
}


export async function mediaIVManipulationLabelsTriggered3(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationLabelsTriggered3(context, options);
}


export async function mediaIVManipulationLatte(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationLatte(context, options);
}


export async function mediaIVManipulationLayer(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationLayer(context, options);
}


export async function mediaIVManipulationLegofy(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationLegofy,
) {
  return raw.mediaIVManipulationLegofy(context, options);
}


export async function mediaIVManipulationLUT(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationLUT,
) {
  return raw.mediaIVManipulationLUT(context, options);
}


export async function mediaIVManipulationMagik(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMagik,
) {
  return raw.mediaIVManipulationMagik(context, options);
}


export async function mediaIVManipulationMagikAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMagikAnimated,
) {
  return raw.mediaIVManipulationMagikAnimated(context, options);
}


export async function mediaIVManipulationMandalaScope(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMandalaScope,
) {
  return raw.mediaIVManipulationMandalaScope(context, options);
}


export async function mediaIVManipulationMeme(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMeme,
) {
  return raw.mediaIVManipulationMeme(context, options);
}


export async function mediaIVManipulationMirrorBottom(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationMirrorBottom(context, options);
}


export async function mediaIVManipulationMirrorLeft(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationMirrorLeft(context, options);
}


export async function mediaIVManipulationMirrorRight(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationMirrorRight(context, options);
}


export async function mediaIVManipulationMirrorTop(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationMirrorTop(context, options);
}


export async function mediaIVManipulationMotionBlur(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMotionBlur,
) {
  return raw.mediaIVManipulationMotionBlur(context, options);
}


export async function mediaIVManipulationMultiply(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMultiply,
) {
  return raw.mediaIVManipulationMultiply(context, options);
}


export async function mediaIVManipulationMuseum(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationMuseum(context, options);
}


export async function mediaIVManipulationOffset(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOffset,
) {
  return raw.mediaIVManipulationOffset(context, options);
}


export async function mediaIVManipulationOldTV(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOldTV,
) {
  return raw.mediaIVManipulationOldTV(context, options);
}


export async function mediaIVManipulationOrb(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOrb,
) {
  return raw.mediaIVManipulationOrb(context, options);
}


export async function mediaIVManipulationOutIn(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
) {
  return raw.mediaIVManipulationOutIn(context, options);
}


export async function mediaIVManipulationOverlay9Gag(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlay9Gag(context, options);
}


export async function mediaIVManipulationOverlayAchievement(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayAchievement,
) {
  return raw.mediaIVManipulationOverlayAchievement(context, options);
}


export async function mediaIVManipulationOverlayAdidas(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayAdidas(context, options);
}


export async function mediaIVManipulationOverlayBandicam(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayBandicam(context, options);
}


export async function mediaIVManipulationOverlayBinoculars(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayBinoculars(context, options);
}


export async function mediaIVManipulationOverlayBlackPanther(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayBlackPanther(context, options);
}


export async function mediaIVManipulationOverlayBrazzers(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayBrazzers(context, options);
}


export async function mediaIVManipulationOverlayCoolGuy(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayCoolGuy(context, options);
}


export async function mediaIVManipulationOverlayDork(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayDork(context, options);
}


export async function mediaIVManipulationOverlayFace(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayFace,
) {
  return raw.mediaIVManipulationOverlayFace(context, options);
}


export async function mediaIVManipulationOverlayFlagAfghanistan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagAfghanistan(context, options);
}


export async function mediaIVManipulationOverlayFlagAlbania(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagAlbania(context, options);
}


export async function mediaIVManipulationOverlayFlagAndorra(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagAndorra(context, options);
}


export async function mediaIVManipulationOverlayFlagAntigua(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagAntigua(context, options);
}


export async function mediaIVManipulationOverlayFlagArgentina(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagArgentina(context, options);
}


export async function mediaIVManipulationOverlayFlagArmenia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagArmenia(context, options);
}


export async function mediaIVManipulationOverlayFlagAsexual(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagAsexual(context, options);
}


export async function mediaIVManipulationOverlayFlagAustralia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagAustralia(context, options);
}


export async function mediaIVManipulationOverlayFlagAustria(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagAustria(context, options);
}


export async function mediaIVManipulationOverlayFlagAzerbaijan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagAzerbaijan(context, options);
}


export async function mediaIVManipulationOverlayFlagBahamas(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBahamas(context, options);
}


export async function mediaIVManipulationOverlayFlagBahrain(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBahrain(context, options);
}


export async function mediaIVManipulationOverlayFlagBangladesh(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBangladesh(context, options);
}


export async function mediaIVManipulationOverlayFlagBarbados(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBarbados(context, options);
}


export async function mediaIVManipulationOverlayFlagBelarus(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBelarus(context, options);
}


export async function mediaIVManipulationOverlayFlagBelgium(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBelgium(context, options);
}


export async function mediaIVManipulationOverlayFlagBelize(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBelize(context, options);
}


export async function mediaIVManipulationOverlayFlagBhutan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBhutan(context, options);
}


export async function mediaIVManipulationOverlayFlagBisexual(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBisexual(context, options);
}


export async function mediaIVManipulationOverlayFlagBolivia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBolivia(context, options);
}


export async function mediaIVManipulationOverlayFlagBosnia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBosnia(context, options);
}


export async function mediaIVManipulationOverlayFlagBrazil(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBrazil(context, options);
}


export async function mediaIVManipulationOverlayFlagBrunei(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBrunei(context, options);
}


export async function mediaIVManipulationOverlayFlagBulgaria(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagBulgaria(context, options);
}


export async function mediaIVManipulationOverlayFlagCambodia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagCambodia(context, options);
}


export async function mediaIVManipulationOverlayFlagCanada(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagCanada(context, options);
}


export async function mediaIVManipulationOverlayFlagChile(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagChile(context, options);
}


export async function mediaIVManipulationOverlayFlagChina(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagChina(context, options);
}


export async function mediaIVManipulationOverlayFlagColombia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagColombia(context, options);
}


export async function mediaIVManipulationOverlayFlagCostaRica(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagCostaRica(context, options);
}


export async function mediaIVManipulationOverlayFlagCroatia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagCroatia(context, options);
}


export async function mediaIVManipulationOverlayFlagCuba(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagCuba(context, options);
}


export async function mediaIVManipulationOverlayFlagCyprus(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagCyprus(context, options);
}


export async function mediaIVManipulationOverlayFlagCzechia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagCzechia(context, options);
}


export async function mediaIVManipulationOverlayFlagDenmark(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagDenmark(context, options);
}


export async function mediaIVManipulationOverlayFlagDominica(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagDominica(context, options);
}


export async function mediaIVManipulationOverlayFlagDominicanRepublic(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagDominicanRepublic(context, options);
}


export async function mediaIVManipulationOverlayFlagEastTimor(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagEastTimor(context, options);
}


export async function mediaIVManipulationOverlayFlagEcuador(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagEcuador(context, options);
}


export async function mediaIVManipulationOverlayFlagEgypt(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagEgypt(context, options);
}


export async function mediaIVManipulationOverlayFlagElSalvador(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagElSalvador(context, options);
}


export async function mediaIVManipulationOverlayFlagEstonia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagEstonia(context, options);
}


export async function mediaIVManipulationOverlayFlagEU(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagEU(context, options);
}


export async function mediaIVManipulationOverlayFlagFiji(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagFiji(context, options);
}


export async function mediaIVManipulationOverlayFlagFinland(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagFinland(context, options);
}


export async function mediaIVManipulationOverlayFlagFrance(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagFrance(context, options);
}


export async function mediaIVManipulationOverlayFlagGeorgia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagGeorgia(context, options);
}


export async function mediaIVManipulationOverlayFlagGermany(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagGermany(context, options);
}


export async function mediaIVManipulationOverlayFlagGreece(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagGreece(context, options);
}


export async function mediaIVManipulationOverlayFlagGrenada(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagGrenada(context, options);
}


export async function mediaIVManipulationOverlayFlagGuatemala(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagGuatemala(context, options);
}


export async function mediaIVManipulationOverlayFlagGuyana(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagGuyana(context, options);
}


export async function mediaIVManipulationOverlayFlagHaiti(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagHaiti(context, options);
}


export async function mediaIVManipulationOverlayFlagHonduras(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagHonduras(context, options);
}


export async function mediaIVManipulationOverlayFlagHongKong(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagHongKong(context, options);
}


export async function mediaIVManipulationOverlayFlagHungary(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagHungary(context, options);
}


export async function mediaIVManipulationOverlayFlagIceland(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagIceland(context, options);
}


export async function mediaIVManipulationOverlayFlagIndia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagIndia(context, options);
}


export async function mediaIVManipulationOverlayFlagIndonesia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagIndonesia(context, options);
}


export async function mediaIVManipulationOverlayFlagIran(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagIran(context, options);
}


export async function mediaIVManipulationOverlayFlagIraq(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagIraq(context, options);
}


export async function mediaIVManipulationOverlayFlagIreland(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagIreland(context, options);
}


export async function mediaIVManipulationOverlayFlagIsrael(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagIsrael(context, options);
}


export async function mediaIVManipulationOverlayFlagItaly(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagItaly(context, options);
}


export async function mediaIVManipulationOverlayFlagJamaica(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagJamaica(context, options);
}


export async function mediaIVManipulationOverlayFlagJapan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagJapan(context, options);
}


export async function mediaIVManipulationOverlayFlagJordan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagJordan(context, options);
}


export async function mediaIVManipulationOverlayFlagKazakhstan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagKazakhstan(context, options);
}


export async function mediaIVManipulationOverlayFlagKiribati(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagKiribati(context, options);
}


export async function mediaIVManipulationOverlayFlagKosovo(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagKosovo(context, options);
}


export async function mediaIVManipulationOverlayFlagKuwait(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagKuwait(context, options);
}


export async function mediaIVManipulationOverlayFlagKyrgyzstan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagKyrgyzstan(context, options);
}


export async function mediaIVManipulationOverlayFlagLaos(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagLaos(context, options);
}


export async function mediaIVManipulationOverlayFlagLatvia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagLatvia(context, options);
}


export async function mediaIVManipulationOverlayFlagLebanon(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagLebanon(context, options);
}


export async function mediaIVManipulationOverlayFlagLesbian(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagLesbian(context, options);
}


export async function mediaIVManipulationOverlayFlagLGBT(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagLGBT(context, options);
}


export async function mediaIVManipulationOverlayFlagLiechtenstein(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagLiechtenstein(context, options);
}


export async function mediaIVManipulationOverlayFlagLithuania(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagLithuania(context, options);
}


export async function mediaIVManipulationOverlayFlagLuxembourg(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagLuxembourg(context, options);
}


export async function mediaIVManipulationOverlayFlagMacau(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMacau(context, options);
}


export async function mediaIVManipulationOverlayFlagMalaysia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMalaysia(context, options);
}


export async function mediaIVManipulationOverlayFlagMaldives(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMaldives(context, options);
}


export async function mediaIVManipulationOverlayFlagMalta(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMalta(context, options);
}


export async function mediaIVManipulationOverlayFlagMarshallIslands(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMarshallIslands(context, options);
}


export async function mediaIVManipulationOverlayFlagMexico(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMexico(context, options);
}


export async function mediaIVManipulationOverlayFlagMicronesia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMicronesia(context, options);
}


export async function mediaIVManipulationOverlayFlagMLM(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMLM(context, options);
}


export async function mediaIVManipulationOverlayFlagMoldova(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMoldova(context, options);
}


export async function mediaIVManipulationOverlayFlagMonaco(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMonaco(context, options);
}


export async function mediaIVManipulationOverlayFlagMongolia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMongolia(context, options);
}


export async function mediaIVManipulationOverlayFlagMontenegro(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMontenegro(context, options);
}


export async function mediaIVManipulationOverlayFlagMyanmar(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagMyanmar(context, options);
}


export async function mediaIVManipulationOverlayFlagNauru(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNauru(context, options);
}


export async function mediaIVManipulationOverlayFlagNepal(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNepal(context, options);
}


export async function mediaIVManipulationOverlayFlagNetherlands(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNetherlands(context, options);
}


export async function mediaIVManipulationOverlayFlagNewZealand(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNewZealand(context, options);
}


export async function mediaIVManipulationOverlayFlagNicaragua(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNicaragua(context, options);
}


export async function mediaIVManipulationOverlayFlagNonBinary(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNonBinary(context, options);
}


export async function mediaIVManipulationOverlayFlagNorthKorea(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNorthKorea(context, options);
}


export async function mediaIVManipulationOverlayFlagNorthMacedonia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNorthMacedonia(context, options);
}


export async function mediaIVManipulationOverlayFlagNorway(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNorway(context, options);
}


export async function mediaIVManipulationOverlayFlagOman(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagOman(context, options);
}


export async function mediaIVManipulationOverlayFlagPakistan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPakistan(context, options);
}


export async function mediaIVManipulationOverlayFlagPalau(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPalau(context, options);
}


export async function mediaIVManipulationOverlayFlagPalestine(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPalestine(context, options);
}


export async function mediaIVManipulationOverlayFlagPanama(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPanama(context, options);
}


export async function mediaIVManipulationOverlayFlagPansexual(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPansexual(context, options);
}


export async function mediaIVManipulationOverlayFlagPapuaNewGuinea(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPapuaNewGuinea(context, options);
}


export async function mediaIVManipulationOverlayFlagParaguay(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagParaguay(context, options);
}


export async function mediaIVManipulationOverlayFlagPeru(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPeru(context, options);
}


export async function mediaIVManipulationOverlayFlagPhilippines(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPhilippines(context, options);
}


export async function mediaIVManipulationOverlayFlagPoland(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPoland(context, options);
}


export async function mediaIVManipulationOverlayFlagPortugal(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagPortugal(context, options);
}


export async function mediaIVManipulationOverlayFlagQatar(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagQatar(context, options);
}


export async function mediaIVManipulationOverlayFlagRomania(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagRomania(context, options);
}


export async function mediaIVManipulationOverlayFlagRussia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagRussia(context, options);
}


export async function mediaIVManipulationOverlayFlagSaintKitts(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSaintKitts(context, options);
}


export async function mediaIVManipulationOverlayFlagSaintLucia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSaintLucia(context, options);
}


export async function mediaIVManipulationOverlayFlagSaintVincent(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSaintVincent(context, options);
}


export async function mediaIVManipulationOverlayFlagSamoa(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSamoa(context, options);
}


export async function mediaIVManipulationOverlayFlagSanMarino(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSanMarino(context, options);
}


export async function mediaIVManipulationOverlayFlagSaudiArabia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSaudiArabia(context, options);
}


export async function mediaIVManipulationOverlayFlagSerbia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSerbia(context, options);
}


export async function mediaIVManipulationOverlayFlagSingapore(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSingapore(context, options);
}


export async function mediaIVManipulationOverlayFlagSlovakia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSlovakia(context, options);
}


export async function mediaIVManipulationOverlayFlagSlovenia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSlovenia(context, options);
}


export async function mediaIVManipulationOverlayFlagSolomonIslands(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSolomonIslands(context, options);
}


export async function mediaIVManipulationOverlayFlagSouthKorea(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSouthKorea(context, options);
}


export async function mediaIVManipulationOverlayFlagSpain(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSpain(context, options);
}


export async function mediaIVManipulationOverlayFlagSriLanka(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSriLanka(context, options);
}


export async function mediaIVManipulationOverlayFlagSuriname(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSuriname(context, options);
}


export async function mediaIVManipulationOverlayFlagSweden(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSweden(context, options);
}


export async function mediaIVManipulationOverlayFlagSwitzerland(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSwitzerland(context, options);
}


export async function mediaIVManipulationOverlayFlagSyria(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagSyria(context, options);
}


export async function mediaIVManipulationOverlayFlagTaiwan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTaiwan(context, options);
}


export async function mediaIVManipulationOverlayFlagTajikistan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTajikistan(context, options);
}


export async function mediaIVManipulationOverlayFlagTaliban(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTaliban(context, options);
}


export async function mediaIVManipulationOverlayFlagThailand(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagThailand(context, options);
}


export async function mediaIVManipulationOverlayFlagTonga(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTonga(context, options);
}


export async function mediaIVManipulationOverlayFlagTrans(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTrans(context, options);
}


export async function mediaIVManipulationOverlayFlagTrinidad(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTrinidad(context, options);
}


export async function mediaIVManipulationOverlayFlagTurkey(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTurkey(context, options);
}


export async function mediaIVManipulationOverlayFlagTurkmenistan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTurkmenistan(context, options);
}


export async function mediaIVManipulationOverlayFlagTuvalu(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTuvalu(context, options);
}


export async function mediaIVManipulationOverlayFlagUAE(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagUAE(context, options);
}


export async function mediaIVManipulationOverlayFlagUK(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagUK(context, options);
}


export async function mediaIVManipulationOverlayFlagUkraine(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagUkraine(context, options);
}


export async function mediaIVManipulationOverlayFlagUruguay(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagUruguay(context, options);
}


export async function mediaIVManipulationOverlayFlagUSA(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagUSA(context, options);
}


export async function mediaIVManipulationOverlayFlagUSSR(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagUSSR(context, options);
}


export async function mediaIVManipulationOverlayFlagUzbekistan(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagUzbekistan(context, options);
}


export async function mediaIVManipulationOverlayFlagVanuatu(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagVanuatu(context, options);
}


export async function mediaIVManipulationOverlayFlagVatican(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagVatican(context, options);
}


export async function mediaIVManipulationOverlayFlagVenezuela(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagVenezuela(context, options);
}


export async function mediaIVManipulationOverlayFlagVietnam(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagVietnam(context, options);
}


export async function mediaIVManipulationOverlayFlagYemen(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagYemen(context, options);
}


export async function mediaIVManipulationOverlayFlies(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayFlies,
) {
  return raw.mediaIVManipulationOverlayFlies(context, options);
}


export async function mediaIVManipulationOverlayGod(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayGod(context, options);
}


export async function mediaIVManipulationOverlayGoldStar(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayGoldStar(context, options);
}


export async function mediaIVManipulationOverlayHalfLifePistol(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayHalfLifePistol(context, options);
}


export async function mediaIVManipulationOverlayHalfLifeShotgun(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayHalfLifeShotgun(context, options);
}


export async function mediaIVManipulationOverlayHalfLifeSMG(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayHalfLifeSMG(context, options);
}


export async function mediaIVManipulationOverlayHyperCam(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayHyperCam(context, options);
}


export async function mediaIVManipulationOverlayKeepItem(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayKeepItem(context, options);
}


export async function mediaIVManipulationOverlayMistake(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayMistake(context, options);
}


export async function mediaIVManipulationOverlayNews(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayNews,
) {
  return raw.mediaIVManipulationOverlayNews(context, options);
}


export async function mediaIVManipulationOverlayNotResponding(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayNotResponding(context, options);
}


export async function mediaIVManipulationOverlayNotification(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayNotification,
) {
  return raw.mediaIVManipulationOverlayNotification(context, options);
}


export async function mediaIVManipulationOverlayOldGuy(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayOldGuy(context, options);
}


export async function mediaIVManipulationOverlayOwO(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayOwO(context, options);
}


export async function mediaIVManipulationOverlayPersonsAjitPai1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsAjitPai1(context, options);
}


export async function mediaIVManipulationOverlayPersonsAustinEvans1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsAustinEvans1(context, options);
}


export async function mediaIVManipulationOverlayPersonsBernie1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsBernie1(context, options);
}


export async function mediaIVManipulationOverlayPersonsBobRoss(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsBobRoss(context, options);
}


export async function mediaIVManipulationOverlayPersonsGaben1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsGaben1(context, options);
}


export async function mediaIVManipulationOverlayPersonsIDubbbz1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsIDubbbz1(context, options);
}


export async function mediaIVManipulationOverlayPersonsJacksfilms1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsJacksfilms1(context, options);
}


export async function mediaIVManipulationOverlayPersonsJesus1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsJesus1(context, options);
}


export async function mediaIVManipulationOverlayPersonsKeemstar1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsKeemstar1(context, options);
}


export async function mediaIVManipulationOverlayPersonsKeemstar2(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsKeemstar2(context, options);
}


export async function mediaIVManipulationOverlayPersonsLTTLinus1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsLTTLinus1(context, options);
}


export async function mediaIVManipulationOverlayPersonsMirandaCosgrove1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsMirandaCosgrove1(context, options);
}


export async function mediaIVManipulationOverlayPersonsStephenHawking1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsStephenHawking1(context, options);
}


export async function mediaIVManipulationOverlayPersonsTrump1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsTrump1(context, options);
}


export async function mediaIVManipulationOverlayPersonsZuckerberg1(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayPersonsZuckerberg1(context, options);
}


export async function mediaIVManipulationOverlayRespects(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayRespects(context, options);
}


export async function mediaIVManipulationOverlayRTX(
  context: RequestContext,
  options: RestOptions.MediaBaseOptionsMultiple,
) {
  return raw.mediaIVManipulationOverlayRTX(context, options);
}


export async function mediaIVManipulationOverlayShutterstock(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayShutterstock(context, options);
}


export async function mediaIVManipulationOverlaySnapchat(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlaySnapchat,
) {
  return raw.mediaIVManipulationOverlaySnapchat(context, options);
}


export async function mediaIVManipulationOverlayStarman(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayStarman(context, options);
}


export async function mediaIVManipulationOverlaySubtitle(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlaySubtitle,
) {
  return raw.mediaIVManipulationOverlaySubtitle(context, options);
}


export async function mediaIVManipulationOverlaySupreme(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlaySupreme(context, options);
}


export async function mediaIVManipulationOverlayThinking(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayThinking(context, options);
}


export async function mediaIVManipulationOverlayTikTok(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayTikTok,
) {
  return raw.mediaIVManipulationOverlayTikTok(context, options);
}


export async function mediaIVManipulationOverlayVHS(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayVHS(context, options);
}


export async function mediaIVManipulationOverlayWasted(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayWasted(context, options);
}


export async function mediaIVManipulationOverlayWatchMojo(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayWatchMojo,
) {
  return raw.mediaIVManipulationOverlayWatchMojo(context, options);
}


export async function mediaIVManipulationOverlayWatermark(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayWatermark,
) {
  return raw.mediaIVManipulationOverlayWatermark(context, options);
}


export async function mediaIVManipulationOverlayWheeze(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayWheeze(context, options);
}


export async function mediaIVManipulationOverlayWhoDidThis(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayWhoDidThis(context, options);
}


export async function mediaIVManipulationOverlayYouTube(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayYouTube,
) {
  return raw.mediaIVManipulationOverlayYouTube(context, options);
}


export async function mediaIVManipulationOverlayYusuke(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayYusuke(context, options);
}


export async function mediaIVManipulationPaint(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPaint,
) {
  return raw.mediaIVManipulationPaint(context, options);
}


export async function mediaIVManipulationPaintAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPaint,
) {
  return raw.mediaIVManipulationPaintAnimated(context, options);
}


export async function mediaIVManipulationPaper(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationPaper(context, options);
}


export async function mediaIVManipulationPhoSimp(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPhoSimp,
) {
  return raw.mediaIVManipulationPhoSimp(context, options);
}


export async function mediaIVManipulationPinchPunch(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPinchPunch,
) {
  return raw.mediaIVManipulationPinchPunch(context, options);
}


export async function mediaIVManipulationPix2Pix(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPix2Pix,
) {
  return raw.mediaIVManipulationPix2Pix(context, options);
}


export async function mediaIVManipulationPixelate(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPixelate,
) {
  return raw.mediaIVManipulationPixelate(context, options);
}


export async function mediaIVManipulationPixelSort(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPixelSort,
) {
  return raw.mediaIVManipulationPixelSort(context, options);
}


export async function mediaIVManipulationPopArt(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPopArt,
) {
  return raw.mediaIVManipulationPopArt(context, options);
}


export async function mediaIVManipulationPrism(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationPrism,
) {
  return raw.mediaIVManipulationPrism(context, options);
}


export async function mediaIVManipulationQuadart(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationQuadart,
) {
  return raw.mediaIVManipulationQuadart(context, options);
}


export async function mediaIVManipulationRain(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationRain(context, options);
}


export async function mediaIVManipulationRainbow(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationRainbow(context, options);
}


export async function mediaIVManipulationRainGold(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationRainGold(context, options);
}


export async function mediaIVManipulationRecaption(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationRecaption,
) {
  return raw.mediaIVManipulationRecaption(context, options);
}


export async function mediaIVManipulationRecolor(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationRecolor(context, options);
}


export async function mediaIVManipulationResize(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationResize,
) {
  return raw.mediaIVManipulationResize(context, options);
}


export async function mediaIVManipulationRGBSplit(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationRGBSplit,
) {
  return raw.mediaIVManipulationRGBSplit(context, options);
}


export async function mediaIVManipulationRipple(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationRipple,
) {
  return raw.mediaIVManipulationRipple(context, options);
}


export async function mediaIVManipulationRotate(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationRotate,
) {
  return raw.mediaIVManipulationRotate(context, options);
}


export async function mediaIVManipulationRotate3d(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationRotate3d,
) {
  return raw.mediaIVManipulationRotate3d(context, options);
}


export async function mediaIVManipulationScramble(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationScramble,
) {
  return raw.mediaIVManipulationScramble(context, options);
}


export async function mediaIVManipulationSepia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationSepia(context, options);
}


export async function mediaIVManipulationSetFPS(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSetFPS,
) {
  return raw.mediaIVManipulationSetFPS(context, options);
}


export async function mediaIVManipulationSetFrameCount(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSetFrameCount,
) {
  return raw.mediaIVManipulationSetFrameCount(context, options);
}


export async function mediaIVManipulationShake(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationShake,
) {
  return raw.mediaIVManipulationShake(context, options);
}


export async function mediaIVManipulationShakeTriggered(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationShakeTriggered(context, options);
}


export async function mediaIVManipulationSharpen(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSharpen,
) {
  return raw.mediaIVManipulationSharpen(context, options);
}


export async function mediaIVManipulationSideToSide(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
) {
  return raw.mediaIVManipulationSideToSide(context, options);
}


export async function mediaIVManipulationSlide(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSlide,
) {
  return raw.mediaIVManipulationSlide(context, options);
}


export async function mediaIVManipulationSnipFrames(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSnipFrames,
) {
  return raw.mediaIVManipulationSnipFrames(context, options);
}


export async function mediaIVManipulationSolarize(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationSolarize(context, options);
}


export async function mediaIVManipulationSpheres(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationSpheres(context, options);
}


export async function mediaIVManipulationSpin(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSpin,
) {
  return raw.mediaIVManipulationSpin(context, options);
}


export async function mediaIVManipulationSpin3d(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSpin3d,
) {
  return raw.mediaIVManipulationSpin3d(context, options);
}


export async function mediaIVManipulationStretch(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationStretch,
) {
  return raw.mediaIVManipulationStretch(context, options);
}


export async function mediaIVManipulationSwapColors(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationSwapColors(context, options);
}


export async function mediaIVManipulationSwapPixels(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationSwapPixels(context, options);
}


export async function mediaIVManipulationSwapRGBA(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSwapRGBA,
) {
  return raw.mediaIVManipulationSwapRGBA(context, options);
}


export async function mediaIVManipulationSwirl(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSwirl,
) {
  return raw.mediaIVManipulationSwirl(context, options);
}


export async function mediaIVManipulationTimecodeVegas(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationTimecodeVegas,
) {
  return raw.mediaIVManipulationTimecodeVegas(context, options);
}


export async function mediaIVManipulationTimesquare(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationTimesquare(context, options);
}


export async function mediaIVManipulationToGif(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationToGif(context, options);
}


export async function mediaIVManipulationTrace(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationTrace(context, options);
}


export async function mediaIVManipulationTrim(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationTrim,
) {
  return raw.mediaIVManipulationTrim(context, options);
}


export async function mediaIVManipulationTunnel(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationTunnel,
) {
  return raw.mediaIVManipulationTunnel(context, options);
}


export async function mediaIVManipulationTVSimulator(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationTVSimulator,
) {
  return raw.mediaIVManipulationTVSimulator(context, options);
}


export async function mediaIVManipulationUncaption(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationUncaption,
) {
  return raw.mediaIVManipulationUncaption(context, options);
}


export async function mediaIVManipulationUniverse(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationUniverse,
) {
  return raw.mediaIVManipulationUniverse(context, options);
}


export async function mediaIVManipulationUpToDown(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationAnimationDelay,
) {
  return raw.mediaIVManipulationUpToDown(context, options);
}


export async function mediaIVManipulationVHS(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationVHS(context, options);
}


export async function mediaIVManipulationVaporwave(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationVaporwave,
) {
  return raw.mediaIVManipulationVaporwave(context, options);
}


export async function mediaIVManipulationWall(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationWall(context, options);
}


export async function mediaIVManipulationWatercolor(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWatercolor,
) {
  return raw.mediaIVManipulationWatercolor(context, options);
}


export async function mediaIVManipulationWave(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWave,
) {
  return raw.mediaIVManipulationWave(context, options);
}


export async function mediaIVManipulationWaveAnimated(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWaveAnimated,
) {
  return raw.mediaIVManipulationWaveAnimated(context, options);
}


export async function mediaIVManipulationWaveVegas(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWaveVegas,
) {
  return raw.mediaIVManipulationWaveVegas(context, options);
}


export async function mediaIVManipulationWiggle(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationWiggle,
) {
  return raw.mediaIVManipulationWiggle(context, options);
}


export async function mediaIVManipulationXyt(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationXyt,
) {
  return raw.mediaIVManipulationXyt(context, options);
}


export async function mediaIVManipulationZoom(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationZoom,
) {
  return raw.mediaIVManipulationZoom(context, options);
}


export async function mediaIVManipulationZoomBlur(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationZoomBlur,
) {
  return raw.mediaIVManipulationZoomBlur(context, options);
}


export async function moderationSafetyScan(
  context: RequestContext,
  options: RestOptions.ModerationSafetyScan,
) {
  return raw.moderationSafetyScan(context, options);
}


export async function moderationTextScan(
  context: RequestContext,
  options: RestOptions.ModerationTextScan,
) {
  return raw.moderationTextScan(context, options);
}


export async function putGeneratedTagError(
  context: RequestContext,
  responseId: string,
  options: RestOptions.PutGeneratedTagError,
) {
  return raw.putGeneratedTagError(context, responseId, options);
}


export async function putGuildSettings(
  context: RequestContext,
  guildId: string,
  options: RestOptions.PutGuildSettings,
): Promise<RestResponses.PutGuildSettings> {
  const data = await raw.putGuildSettings(context, guildId, options);
  let settings: GuildSettings;
  if (GuildSettingsStore.has(guildId)) {
    settings = GuildSettingsStore.get(guildId)!;
    settings.merge(data);
  } else {
    settings = new GuildSettings(data);
    GuildSettingsStore.set(settings.id, settings);
  }
  return settings;
}


export async function putInfoDiscord(
  context: RequestContext,
  options: RestOptions.PutInfoDiscord,
) {
  return raw.putInfoDiscord(context, options);
}


export async function putInfoMetrics(
  context: RequestContext,
  options: RestOptions.PutInfoMetrics,
) {
  return raw.putInfoMetrics(context, options);
}


export async function putInfoDiscordGuilds(
  context: RequestContext,
  options: RestOptions.PutInfoDiscordGuilds,
) {
  return raw.putInfoDiscordGuilds(context, options);
}


export async function postInfoDiscordGuildsChanges(
  context: RequestContext,
  options: RestOptions.PostInfoDiscordGuildsChanges,
) {
  return raw.postInfoDiscordGuildsChanges(context, options);
}


export async function putServerSettings(
  context: RequestContext,
  serverId: string,
  options: RestOptions.PutServerSettings,
): Promise<RestResponses.PutServerSettings> {
  const data = await raw.putServerSettings(context, serverId, options);
  let settings: ServerSettings;
  if (ServerSettingsStore.has(serverId)) {
    settings = ServerSettingsStore.get(serverId)!;
    settings.merge(data);
  } else {
    settings = new ServerSettings(data);
    ServerSettingsStore.set(settings.id, settings);
  }
  return settings;
}


export async function putTag(
  context: RequestContext,
  options: RestOptions.PutTag,
) {
  return raw.putTag(context, options);
}


export async function putTagsDirectoryTag(
  context: RequestContext,
  tagId: string,
  options: RestOptions.PutTagsDirectoryTag,
) {
  return raw.putTagsDirectoryTag(context, tagId, options);
}


export async function putTagBlobs(
  context: RequestContext,
  tagId: string,
  options: RestOptions.PutTagBlobs,
) {
  return raw.putTagBlobs(context, tagId, options);
}


export async function putTagVariable(
  context: RequestContext,
  tagId: string,
  storageType: number,
  storageId: string,
  options: RestOptions.PutTagVariable,
) {
  return raw.putTagVariable(context, tagId, storageType, storageId, options);
}


export async function putTagVariables(
  context: RequestContext,
  tagId: string,
  options: RestOptions.PutTagVariables,
) {
  return raw.putTagVariables(context, tagId, options);
}


export async function putUser(
  context: RequestContext,
  userId: string,
  options: RestOptions.PutUser,
): Promise<RestResponses.PutUser> {
  const data = await raw.putUser(context, userId, options);
  let user: UserFull;
  if (UserStore.has(userId)) {
    user = UserStore.get(userId)!;
    user.merge(data);
  } else {
    user = new UserFull(data);
    UserStore.set(user.id, user);
  }
  return user;
}


export async function removeGuildFeature(
  context: RequestContext,
  guildId: string,
  feature: string,
) {
  return raw.removeGuildFeature(context, guildId, feature);
}


export async function search4Chan(
  context: RequestContext,
  options: RestOptions.Search4Chan,
) {
  return raw.search4Chan(context, options);
}


export async function search4ChanRandom(
  context: RequestContext,
  options: RestOptions.Search4ChanRandom,
) {
  return raw.search4ChanRandom(context, options);
}


export async function searchBing(
  context: RequestContext,
  options: RestOptions.SearchBing,
) {
  return raw.searchBing(context, options);
}


export async function searchBingImages(
  context: RequestContext,
  options: RestOptions.SearchBingImages,
) {
  return raw.searchBingImages(context, options);
}


export async function searchDuckDuckGo(
  context: RequestContext,
  options: RestOptions.SearchDuckDuckGo,
) {
  return raw.searchDuckDuckGo(context, options);
}


export async function searchDuckDuckGoImages(
  context: RequestContext,
  options: RestOptions.SearchDuckDuckGoImages,
) {
  return raw.searchDuckDuckGoImages(context, options);
}


export async function searchE621(
  context: RequestContext,
  options: RestOptions.SearchE621,
) {
  return raw.searchE621(context, options);
}


export async function searchE926(
  context: RequestContext,
  options: RestOptions.SearchE926,
) {
  return raw.searchE926(context, options);
}


export async function searchGoogle(
  context: RequestContext,
  options: RestOptions.SearchGoogle,
) {
  return raw.searchGoogle(context, options);
}


export async function searchGoogleImages(
  context: RequestContext,
  options: RestOptions.SearchGoogleImages,
): Promise<RestResponses.SearchGoogleImages> {
  const { results: data } = await raw.searchGoogleImages(context, options);
  const collection = [];
  for (let raw of data) {
    const result = new GoogleSearchImageResult(raw);
    collection.push(result);
  }
  return collection;
}


export async function searchGoogleReverseImages(
  context: RequestContext,
  options: RestOptions.SearchGoogleReverseImages,
) {
  return raw.searchGoogleReverseImages(context, options);
}


export async function searchImgur(
  context: RequestContext,
  options: RestOptions.SearchImgur,
) {
  return raw.searchImgur(context, options);
}


export async function searchReddit(
  context: RequestContext,
  options: RestOptions.SearchReddit,
) {
  return raw.searchReddit(context, options);
}


export async function searchRule34(
  context: RequestContext,
  options: RestOptions.SearchRule34,
) {
  return raw.searchRule34(context, options);
}


export async function searchRule34Paheal(
  context: RequestContext,
  options: RestOptions.SearchRule34Paheal,
) {
  return raw.searchRule34Paheal(context, options);
}


export async function searchSteam(
  context: RequestContext,
  options: RestOptions.SearchSteam,
) {
  return raw.searchSteam(context, options);
}


export async function searchSteamEmoji(
  context: RequestContext,
  emoji: string,
) {
  return raw.searchSteamEmoji(context, emoji);
}


export async function searchSteamEmojis(
  context: RequestContext,
  options: RestOptions.SearchSteamEmojis,
) {
  return raw.searchSteamEmojis(context, options);
}


export async function searchSteamProfile(
  context: RequestContext,
  options: RestOptions.SearchSteamProfile,
) {
  return raw.searchSteamProfile(context, options);
}


export async function searchUrban(
  context: RequestContext,
  options: RestOptions.SearchUrban,
) {
  return raw.searchUrban(context, options);
}


export async function searchUrbanRandom(
  context: RequestContext,
  options: RestOptions.SearchUrbanRandom = {},
) {
  return raw.searchUrbanRandom(context, options);
}


export async function searchWikihow(
  context: RequestContext,
  options: RestOptions.SearchWikihow,
) {
  return raw.searchWikihow(context, options);
}


export async function searchWikihowRandom(
  context: RequestContext,
  options: RestOptions.SearchWikihowRandom = {},
) {
  return raw.searchWikihowRandom(context, options);
}


export async function searchWolframAlpha(
  context: RequestContext,
  options: RestOptions.SearchWolframAlpha,
) {
  return raw.searchWolframAlpha(context, options);
}


export async function searchOpenverse(
  context: RequestContext,
  options: RestOptions.SearchOpenverse,
) {
  return raw.searchOpenverse(context, options);
}


export async function searchYandex(
  context: RequestContext,
  options: RestOptions.SearchYandex,
) {
  return raw.searchYandex(context, options);
}


export async function searchYandexImages(
  context: RequestContext,
  options: RestOptions.SearchYandexImages,
) {
  return raw.searchYandexImages(context, options);
}


export async function searchYoutube(
  context: RequestContext,
  options: RestOptions.SearchYoutube,
) {
  return raw.searchYoutube(context, options);
}


export async function uploadCommands(
  context: RequestContext,
  options: RestOptions.UploadCommands,
) {
  return raw.uploadCommands(context, options);
}


export async function utilitiesCodeRun(
  context: RequestContext,
  options: RestOptions.UtilitiesCodeRun,
) {
  return raw.utilitiesCodeRun(context, options);
}


export async function utilitiesFetchMedia(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchMedia,
) {
  return raw.utilitiesFetchMedia(context, options);
}


export async function utilitiesFetchText(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchText,
) {
  return raw.utilitiesFetchText(context, options);
}


export async function utilitiesLocations(
  context: RequestContext,
  options: RestOptions.UtilitiesLocations,
) {
  return raw.utilitiesLocations(context, options);
}


export async function utilitiesMediascript(
  context: RequestContext,
  options: RestOptions.UtilitiesMediascript,
) {
  return raw.utilitiesMediascript(context, options);
}


export async function utilitiesMLEdit(
  context: RequestContext,
  options: RestOptions.UtilitiesMLEdit,
) {
  return raw.utilitiesMLEdit(context, options);
}


export async function utilitiesMLImagine(
  context: RequestContext,
  options: RestOptions.UtilitiesMLImagine,
) {
  return raw.utilitiesMLImagine(context, options);
}


export async function utilitiesMLInterrogate(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.utilitiesMLInterrogate(context, options);
}


export async function utilitiesMLMashup(
  context: RequestContext,
  options: RestOptions.UtilitiesMLMashup,
) {
  return raw.utilitiesMLMashup(context, options);
}


export async function utilitiesMLTone(
  context: RequestContext,
  options: RestOptions.UtilitiesMLTone,
) {
  return raw.utilitiesMLTone(context, options);
}


export async function utilitiesProxyRequest(
  context: RequestContext,
  options: RestOptions.UtilitiesProxyRequest,
) {
  return raw.utilitiesProxyRequest(context, options);
}


export async function utilitiesQrCreate(
  context: RequestContext,
  options: RestOptions.UtilitiesQrCreate,
) {
  return raw.utilitiesQrCreate(context, options);
}


export async function utilitiesQrScan(
  context: RequestContext,
  options: RestOptions.UtilitiesQrScan,
) {
  return raw.utilitiesQrScan(context, options);
}


export async function utilitiesScreenshot(
  context: RequestContext,
  options: RestOptions.UtilitiesScreenshot,
) {
  return raw.utilitiesScreenshot(context, options);
}


export async function utilitiesUnicode(
  context: RequestContext,
  options: RestOptions.UtilitiesUnicode,
) {
  return raw.utilitiesUnicode(context, options);
}


export async function utilitiesWeather(
  context: RequestContext,
  options: RestOptions.UtilitiesWeather,
) {
  return raw.utilitiesWeather(context, options);
}


export async function voiceCloneAdd(
  context: RequestContext,
  voiceId: string,
  options: RestOptions.VoiceCloneAdd,
) {
  return raw.voiceCloneAdd(context, voiceId, options);
}


export async function voiceCloneEdit(
  context: RequestContext,
  voiceId: string,
  options: RestOptions.VoiceCloneEdit,
) {
  return raw.voiceCloneEdit(context, voiceId, options);
}
