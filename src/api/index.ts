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


export async function audioToolsConvert(
  context: RequestContext,
  options: RestOptions.AudioToolsConvertOptions,
) {
  return raw.audioToolsConvert(context, options);
}


export async function audioToolsIdentify(
  context: RequestContext,
  options: RestOptions.AudioBaseOptions,
) {
  return raw.audioToolsIdentify(context, options);
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


export async function imageCreateRetrowave(
  context: RequestContext,
  options: RestOptions.ImageCreateRetrowave,
) {
  return raw.imageCreateRetrowave(context, options);
}


export async function imageCreateTombstone(
  context: RequestContext,
  options: RestOptions.ImageCreateTombstone,
) {
  return raw.imageCreateTombstone(context, options);
}


export async function imageCreateWordcloud(
  context: RequestContext,
  options: RestOptions.ImageCreateWordcloud,
) {
  return raw.imageCreateWordcloud(context, options);
}


export async function imageInformationExif(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageInformationExif(context, options);
}


export async function imageManipulationAscii(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationAscii(context, options);
}


export async function imageManipulationBlur(
  context: RequestContext,
  options: RestOptions.ImageManipulationBlur,
) {
  return raw.imageManipulationBlur(context, options);
}


export async function imageManipulationBlurple(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationBlurple(context, options);
}


export async function imageManipulationCircle(
  context: RequestContext,
  options: RestOptions.ImageManipulationCircle,
) {
  return raw.imageManipulationCircle(context, options);
}


export async function imageManipulationDeepfry(
  context: RequestContext,
  options: RestOptions.ImageManipulationDeepfry,
) {
  return raw.imageManipulationDeepfry(context, options);
}


export async function imageManipulationExplode(
  context: RequestContext,
  options: RestOptions.ImageManipulationExplode,
) {
  return raw.imageManipulationExplode(context, options);
}


export async function imageManipulationEyes(
  context: RequestContext,
  options: RestOptions.ImageManipulationEyes,
) {
  return raw.imageManipulationEyes(context, options);
}


export async function imageManipulationFlip(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationFlip(context, options);
}


export async function imageManipulationFlop(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationFlop(context, options);
}


export async function imageManipulationGlitch(
  context: RequestContext,
  options: RestOptions.ImageManipulationGlitch,
) {
  return raw.imageManipulationGlitch(context, options);
}


export async function imageManipulationGlitchGif(
  context: RequestContext,
  options: RestOptions.ImageManipulationGlitch,
) {
  return raw.imageManipulationGlitchGif(context, options);
}


export async function imageManipulationGlobe(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationGlobe(context, options);
}


export async function imageManipulationGold(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationGold(context, options);
}


export async function imageManipulationGrayscale(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationGrayscale(context, options);
}


export async function imageManipulationImplode(
  context: RequestContext,
  options: RestOptions.ImageManipulationImplode,
) {
  return raw.imageManipulationImplode(context, options);
}


export async function imageManipulationInvert(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationInvert(context, options);
}


export async function imageManipulationJPEG(
  context: RequestContext,
  options: RestOptions.ImageManipulationJPEG,
) {
  return raw.imageManipulationJPEG(context, options);
}


export async function imageManipulationLegofy(
  context: RequestContext,
  options: RestOptions.ImageManipulationLegofy,
) {
  return raw.imageManipulationLegofy(context, options);
}


export async function imageManipulationMagik(
  context: RequestContext,
  options: RestOptions.ImageManipulationMagik,
) {
  return raw.imageManipulationMagik(context, options);
}


export async function imageManipulationMagikGif(
  context: RequestContext,
  options: RestOptions.ImageManipulationMagik,
) {
  return raw.imageManipulationMagikGif(context, options);
}


export async function imageManipulationMeme(
  context: RequestContext,
  options: RestOptions.ImageManipulationMeme,
) {
  return raw.imageManipulationMeme(context, options);
}


export async function imageManipulationMirrorBottom(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationMirrorBottom(context, options);
}


export async function imageManipulationMirrorLeft(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationMirrorLeft(context, options);
}


export async function imageManipulationMirrorRight(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationMirrorRight(context, options);
}


export async function imageManipulationMirrorTop(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationMirrorTop(context, options);
}


export async function imageManipulationPaper(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationPaper(context, options);
}


export async function imageManipulationPixelate(
  context: RequestContext,
  options: RestOptions.ImageManipulationPixelate,
) {
  return raw.imageManipulationPixelate(context, options);
}


export async function imageManipulationRain(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationRain(context, options);
}


export async function imageManipulationRainGold(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationRainGold(context, options);
}


export async function imageManipulationSharpen(
  context: RequestContext,
  options: RestOptions.ImageManipulationSharpen,
) {
  return raw.imageManipulationSharpen(context, options);
}


export async function imageManipulationSpin(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationSpin(context, options);
}


export async function imageManipulationTrace(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationTrace(context, options);
}


export async function imageManipulationWall(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageManipulationWall(context, options);
}


export async function imageOverlayFlagIsrael(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayFlagIsrael(context, options);
}


export async function imageOverlayFlagLGBT(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayFlagLGBT(context, options);
}


export async function imageOverlayFlagNorthKorea(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayFlagNorthKorea(context, options);
}


export async function imageOverlayFlagRussia(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayFlagRussia(context, options);
}


export async function imageOverlayFlagTrans(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayFlagTrans(context, options);
}


export async function imageOverlayFlagUK(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayFlagUK(context, options);
}


export async function imageOverlayFlagUSA(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayFlagUSA(context, options);
}


export async function imageOverlayFlagUSSR(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayFlagUSSR(context, options);
}


export async function imageOverlayHalfLifePistol(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayHalfLifePistol(context, options);
}


export async function imageOverlayHalfLifeShotgun(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayHalfLifeShotgun(context, options);
}


export async function imageOverlayHalfLifeSMG(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayHalfLifeSMG(context, options);
}


export async function imageOverlayShutterstock(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageOverlayShutterstock(context, options);
}


export async function imageToolsBackgroundRemove(
  context: RequestContext,
  options: RestOptions.ImageBackgroundRemoveOptions,
) {
  return raw.imageToolsBackgroundRemove(context, options);
}


export async function imageToolsConvert(
  context: RequestContext,
  options: RestOptions.ImageToolsConvert,
) {
  return raw.imageToolsConvert(context, options);
}


export async function imageToolsCrop(
  context: RequestContext,
  options: RestOptions.ImageToolsCrop,
) {
  return raw.imageToolsCrop(context, options);
}


export async function imageToolsGifReverse(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageToolsGifReverse(context, options);
}


export async function imageToolsGifSeeSaw(
  context: RequestContext,
  options: RestOptions.ImageBaseOptions,
) {
  return raw.imageToolsGifSeeSaw(context, options);
}


export async function imageToolsGifSpeed(
  context: RequestContext,
  options: RestOptions.ImageToolsGifSpeed,
) {
  return raw.imageToolsGifSpeed(context, options);
}


export async function imageToolsResize(
  context: RequestContext,
  options: RestOptions.ImageToolsResize,
) {
  return raw.imageToolsResize(context, options);
}


export async function imageToolsRotate(
  context: RequestContext,
  options: RestOptions.ImageToolsRotate,
) {
  return raw.imageToolsRotate(context, options);
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

export async function utilitiesCodeRunRextester(
  context: RequestContext,
  options: RestOptions.UtilitiesCodeRunRextester,
) {
  return raw.utilitiesCodeRunRextester(context, options);
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


export async function videoToolsConvert(
  context: RequestContext,
  options: RestOptions.VideoToolsConvertOptions,
) {
  return raw.videoToolsConvert(context, options);
}


export async function videoToolsExtractAudio(
  context: RequestContext,
  options: RestOptions.VideoBaseOptions,
) {
  return raw.videoToolsExtractAudio(context, options);
}
