import { Collections, Command } from 'detritus-client';
import { Response } from 'detritus-rest';
import { HTTPMethods } from 'detritus-rest/lib/constants';

import {
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildDisableCommandsTypes,
} from '../constants';
import GuildSettingsStore from '../stores/guildsettings';
import UserStore from '../stores/users';

import * as Endpoints from './endpoints';
import * as raw from './raw';
import { RequestContext } from './raw';
import { GoogleSearchImageResult } from './structures/googlesearchimageresult';
import {
  GuildSettings,
  GuildSettingsLogger,
  GuildSettingsPrefix,
} from './structures/guildsettings';
import { UserFull } from './structures/user';
import { RestOptions, RestResponses } from './types';

export { request } from './raw';
export { Endpoints, RequestContext, raw };


export async function audioToolsPutConcat(
  context: RequestContext,
  options: RestOptions.MediaAToolsPutBase,
) {
  return raw.audioToolsPutConcat(context, options);
}


export async function audioToolsPutMix(
  context: RequestContext,
  options: RestOptions.MediaAToolsPutBase,
) {
  return raw.audioToolsPutMix(context, options);
}


export async function audioToolsPutReplace(
  context: RequestContext,
  options: RestOptions.MediaAToolsPutBase,
) {
  return raw.audioToolsPutReplace(context, options);
}


export async function createGuildAllowlist(
  context: RequestContext,
  guildId: string,
  allowlistId: string,
  type: GuildAllowlistTypes,
): Promise<RestResponses.CreateGuildAllowlist> {
  return raw.createGuildAllowlist(context, guildId, allowlistId, type);
}


export async function createGuildBlocklist(
  context: RequestContext,
  guildId: string,
  blocklistId: string,
  type: GuildBlocklistTypes,
): Promise<RestResponses.CreateGuildBlocklist> {
  return raw.createGuildBlocklist(context, guildId, blocklistId, type);
}


export async function createGuildDisabledCommand(
  context: RequestContext,
  guildId: string,
  command: string,
  disabledId: string,
  type: GuildDisableCommandsTypes,
): Promise<RestResponses.CreateGuildDisabledCommand> {
  return raw.createGuildDisabledCommand(context, guildId, command, disabledId, type);
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
    const settings = GuildSettingsStore.get(guildId) as GuildSettings;
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
    const settings = GuildSettingsStore.get(guildId) as GuildSettings;
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


export async function createTagUse(
  context: RequestContext,
  tagId: string,
  options: RestOptions.CreateTagUse,
) {
  return raw.createTagUse(context, tagId, options);
}


export async function createUserCommand(
  context: RequestContext,
  userId: string,
  command: string,
  options: RestOptions.CreateUserCommand,
) {
  return raw.createUserCommand(context, userId, command, options);
}


export async function deleteChannel(
  context: RequestContext,
  channelId: string,
  options: RestOptions.DeleteChannel,
) {
  return raw.deleteChannel(context, channelId, options);
}


export async function deleteGuildAllowlist(
  context: RequestContext,
  guildId: string,
  allowlistId: string,
  type: GuildAllowlistTypes,
): Promise<RestResponses.DeleteGuildAllowlist> {
  return raw.deleteGuildAllowlist(context, guildId, allowlistId, type);
}


export async function deleteGuildBlocklist(
  context: RequestContext,
  guildId: string,
  blocklistId: string,
  type: GuildBlocklistTypes,
): Promise<RestResponses.DeleteGuildBlocklist> {
  return raw.deleteGuildBlocklist(context, guildId, blocklistId, type);
}


export async function deleteGuildDisabledCommand(
  context: RequestContext,
  guildId: string,
  command: string,
  disabledId: string,
  type: GuildDisableCommandsTypes,
): Promise<RestResponses.DeleteGuildDisabledCommand> {
  return raw.deleteGuildDisabledCommand(context, guildId, command, disabledId, type);
}


export async function deleteGuildLogger(
  context: RequestContext,
  guildId: string,
  options: RestOptions.DeleteGuildLogger,
): Promise<RestResponses.DeleteGuildLogger> {
  const data = await raw.deleteGuildLogger(context, guildId, options);
  const collection = new Collections.BaseCollection<string, GuildSettingsLogger>();
  for (let raw of data) {
    const item = new GuildSettingsLogger(raw);
    collection.set(item.key, item);
  }
  if (GuildSettingsStore.has(guildId)) {
    const settings = GuildSettingsStore.get(guildId) as GuildSettings;
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
    const settings = GuildSettingsStore.get(guildId) as GuildSettings;
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


export async function deleteTag(
  context: RequestContext,
  options: RestOptions.DeleteTag,
) {
  return raw.deleteTag(context, options);
}


export async function deleteTagsServer(
  context: RequestContext,
  serverId: string,
  options: RestOptions.DeleteTagsServer = {},
) {
  return raw.deleteTagsServer(context, serverId, options);
}


export async function editGuildSettings(
  context: RequestContext,
  guildId: string,
  options: RestOptions.EditGuildSettings = {},
): Promise<RestResponses.EditGuildSettings> {
  const data = await raw.editGuildSettings(context, guildId, options);
  let settings: GuildSettings;
  if (GuildSettingsStore.has(guildId)) {
    settings = GuildSettingsStore.get(guildId) as GuildSettings;
    settings.merge(data);
  } else {
    settings = new GuildSettings(data);
    GuildSettingsStore.set(settings.id, settings);
  }
  return settings;
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


export async function fetchGuildSettings(
  context: RequestContext,
  guildId: string,
): Promise<RestResponses.FetchGuildSettings> {
  const data = await raw.fetchGuildSettings(context, guildId);
  let settings: GuildSettings;
  if (GuildSettingsStore.has(guildId)) {
    settings = GuildSettingsStore.get(guildId) as GuildSettings;
    settings.merge(data);
  } else {
    settings = new GuildSettings(data);
    GuildSettingsStore.set(settings.id, settings);
  }
  return settings;
}


export async function fetchReminders(
  context: RequestContext,
  options: RestOptions.FetchReminders,
) {
  return raw.fetchReminders(context, options);
}


export async function fetchTag(
  context: RequestContext,
  options: RestOptions.FetchTag,
) {
  return raw.fetchTag(context, options);
}


export async function fetchTagRandom(
  context: RequestContext,
  options: RestOptions.FetchTagRandom = {},
) {
  return raw.fetchTagRandom(context, options);
}


export async function fetchTagsServer(
  context: RequestContext,
  guildId: string,
  options: RestOptions.FetchTagsServer = {},
) {
  return raw.fetchTagsServer(context, guildId, options);
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


export async function fetchUserTags(
  context: RequestContext,
  userId: string,
  options: RestOptions.FetchUserTags = {},
) {
  return raw.fetchUserTags(context, userId, options);
}


export async function funASCII(
  context: RequestContext,
  options: RestOptions.FunASCII,
) {
  return raw.funASCII(context, options);
}


export async function funTextToSpeech(
  context: RequestContext,
  options: RestOptions.FunTextToSpeech,
) {
  return raw.funTextToSpeech(context, options);
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


export async function mediaAIVManipulationADHD(
  context: RequestContext,
  options: RestOptions.MediaAIVManipulationADHD,
) {
  return raw.mediaAIVManipulationADHD(context, options);
}


export async function mediaAIVToolsConcat(
  context: RequestContext,
  options: RestOptions.MediaBaseOptionsMultiple,
) {
  return raw.mediaAIVToolsConcat(context, options);
}


export async function mediaAIVToolsConvert(
  context: RequestContext,
  options: RestOptions.MediaAIVToolsConvert,
) {
  return raw.mediaAIVToolsConvert(context, options);
}


export async function mediaAIVToolsExif(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAIVToolsExif(context, options);
}


export async function mediaAIVToolsJoin(
  context: RequestContext,
  options: RestOptions.MediaAIVToolsJoin,
) {
  return raw.mediaAIVToolsJoin(context, options);
}


export async function mediaAIVToolsOverlay(
  context: RequestContext,
  options: RestOptions.MediaAIVToolsOverlay,
) {
  return raw.mediaAIVToolsOverlay(context, options);
}


export async function mediaAIVToolsReverse(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAIVToolsReverse(context, options);
}


export async function mediaAIVToolsSeeSaw(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAIVToolsSeeSaw(context, options);
}


export async function mediaAIVToolsSnip(
  context: RequestContext,
  options: RestOptions.MediaAIVToolsSnip,
) {
  return raw.mediaAIVToolsSnip(context, options);
}


export async function mediaAIVToolsSpeed(
  context: RequestContext,
  options: RestOptions.MediaIVToolsSpeed,
) {
  return raw.mediaAIVToolsSpeed(context, options);
}


export async function mediaAVManipulationBoostBass(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVManipulationBoostBass(context, options);
}

export async function mediaAVManipulationCompress(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVManipulationCompress(context, options);
}


export async function mediaAVManipulationDestroy(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVManipulationDestroy(context, options);
}


export async function mediaAVManipulationVolume(
  context: RequestContext,
  options: RestOptions.MediaAVManipulationVolume,
) {
  return raw.mediaAVManipulationVolume(context, options);
}


export async function mediaAVToolsExtractAudio(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaAVToolsExtractAudio(context, options);
}


export async function mediaAVToolsIdentify(
  context: RequestContext,
  options: RestOptions.MediaAVToolsIdentify,
) {
  return raw.mediaAVToolsIdentify(context, options);
}


export async function mediaICreateRetrowave(
  context: RequestContext,
  options: RestOptions.MediaICreateRetrowave,
) {
  return raw.mediaICreateRetrowave(context, options);
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


export async function mediaIVManipulationAscii(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationAscii(context, options);
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


export async function mediaIVManipulationCaption(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCaption,
) {
  return raw.mediaIVManipulationCaption(context, options);
}


export async function mediaIVManipulationCircle(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationCircle,
) {
  return raw.mediaIVManipulationCircle(context, options);
}


export async function mediaIVManipulationDeepfry(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationDeepfry,
) {
  return raw.mediaIVManipulationDeepfry(context, options);
}


export async function mediaIVManipulationExplode(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationExplode,
) {
  return raw.mediaIVManipulationExplode(context, options);
}


export async function mediaIVManipulationEyes(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationEyes,
) {
  return raw.mediaIVManipulationEyes(context, options);
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


export async function mediaIVManipulationGlitch(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlitch,
) {
  return raw.mediaIVManipulationGlitch(context, options);
}


export async function mediaIVManipulationGlitchGif(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationGlitch,
) {
  return raw.mediaIVManipulationGlitchGif(context, options);
}


export async function mediaIVManipulationGlobe(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationGlobe(context, options);
}


export async function mediaIVManipulationGold(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationGold(context, options);
}


export async function mediaIVManipulationGrayscale(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationGrayscale(context, options);
}


export async function mediaIVManipulationImplode(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationImplode,
) {
  return raw.mediaIVManipulationImplode(context, options);
}


export async function mediaIVManipulationInvert(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationInvert(context, options);
}


export async function mediaIVManipulationJPEG(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationJPEG,
) {
  return raw.mediaIVManipulationJPEG(context, options);
}


export async function mediaIVManipulationLegofy(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationLegofy,
) {
  return raw.mediaIVManipulationLegofy(context, options);
}


export async function mediaIVManipulationMagik(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMagik,
) {
  return raw.mediaIVManipulationMagik(context, options);
}


export async function mediaIVManipulationMagikGif(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationMagik,
) {
  return raw.mediaIVManipulationMagikGif(context, options);
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


export async function mediaIVManipulationOverlayFlagIsrael(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagIsrael(context, options);
}


export async function mediaIVManipulationOverlayFlagLGBT(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagLGBT(context, options);
}


export async function mediaIVManipulationOverlayFlagNorthKorea(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagNorthKorea(context, options);
}


export async function mediaIVManipulationOverlayFlagRussia(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagRussia(context, options);
}


export async function mediaIVManipulationOverlayFlagTrans(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagTrans(context, options);
}


export async function mediaIVManipulationOverlayFlagUK(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayFlagUK(context, options);
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


export async function mediaIVManipulationOverlayFlies(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationOverlayFlies,
) {
  return raw.mediaIVManipulationOverlayFlies(context, options);
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


export async function mediaIVManipulationOverlayShutterstock(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationOverlayShutterstock(context, options);
}


export async function mediaIVManipulationPaper(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationPaper(context, options);
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


export async function mediaIVManipulationRain(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationRain(context, options);
}


export async function mediaIVManipulationRainGold(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationRainGold(context, options);
}


export async function mediaIVManipulationSharpen(
  context: RequestContext,
  options: RestOptions.MediaIVManipulationSharpen,
) {
  return raw.mediaIVManipulationSharpen(context, options);
}


export async function mediaIVManipulationSpin(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationSpin(context, options);
}


export async function mediaIVManipulationTrace(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationTrace(context, options);
}


export async function mediaIVManipulationWall(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVManipulationWall(context, options);
}


export async function mediaIVToolsBackgroundRemove(
  context: RequestContext,
  options: RestOptions.MediaIVToolsBackgroundRemoveOptions,
) {
  return raw.mediaIVToolsBackgroundRemove(context, options);
}


export async function mediaIVToolsCrop(
  context: RequestContext,
  options: RestOptions.MediaIVToolsCrop,
) {
  return raw.mediaIVToolsCrop(context, options);
}


export async function mediaIVToolsCropAuto(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVToolsCropAuto(context, options);
}


export async function mediaIVToolsCropCircle(
  context: RequestContext,
  options: RestOptions.MediaIVToolsCropCircle,
) {
  return raw.mediaIVToolsCropCircle(context, options);
}


export async function mediaIVToolsCropTwitterHex(
  context: RequestContext,
  options: RestOptions.MediaIVToolsCropTwitterHex,
) {
  return raw.mediaIVToolsCropTwitterHex(context, options);
}


export async function mediaIVToolsObjectRemove(
  context: RequestContext,
  options: RestOptions.MediaIVToolsObjectRemoveOptions,
) {
  return raw.mediaIVToolsObjectRemove(context, options);
}


export async function mediaIVToolsResize(
  context: RequestContext,
  options: RestOptions.MediaIVToolsResize,
) {
  return raw.mediaIVToolsResize(context, options);
}


export async function mediaIVToolsRotate(
  context: RequestContext,
  options: RestOptions.MediaIVToolsRotate,
) {
  return raw.mediaIVToolsRotate(context, options);
}


export async function mediaIVToolsTrim(
  context: RequestContext,
  options: RestOptions.MediaBaseOptions,
) {
  return raw.mediaIVToolsTrim(context, options);
}


export async function putGuildSettings(
  context: RequestContext,
  guildId: string,
  options: RestOptions.PutGuildSettings,
): Promise<RestResponses.PutGuildSettings> {
  const data = await raw.putGuildSettings(context, guildId, options);
  let settings: GuildSettings;
  if (GuildSettingsStore.has(guildId)) {
    settings = GuildSettingsStore.get(guildId) as GuildSettings;
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


export async function putTag(
  context: RequestContext,
  options: RestOptions.PutTag,
) {
  return raw.putTag(context, options);
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
  const data = await raw.searchGoogleImages(context, options);
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


export async function utilitiesFetchData(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchData,
) {
  return raw.utilitiesFetchData(context, options);
}

export async function utilitiesFetchImage(
  context: RequestContext,
  options: RestOptions.UtilitiesFetchImage,
) {
  return raw.utilitiesFetchImage(context, options);
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


export async function utilitiesImagescriptV1(
  context: RequestContext,
  options: RestOptions.UtilitiesImagescriptV1,
) {
  return raw.utilitiesImagescriptV1(context, options);
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
