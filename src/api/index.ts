import { Collections, Command } from 'detritus-client';
import { Response } from 'detritus-rest';
import { HTTPMethods } from 'detritus-rest/lib/constants';

import * as raw from './raw';
import { GoogleSearchImageResult } from './structures/googlesearchimageresult';
import {
  GuildSettings,
  GuildSettingsPrefix,
} from './structures/guildsettings';
import { RestOptions, RestResponses } from './types';

import {
  GuildAllowlistTypes,
  GuildBlocklistTypes,
  GuildDisableCommandsTypes,
} from '../constants';
import GuildSettingsStore from '../stores/guildsettings';


export { request } from './raw';
export { raw };


export async function createGuildAllowlist(
  context: Command.Context,
  guildId: string,
  allowlistId: string,
  type: GuildAllowlistTypes,
): Promise<RestResponses.CreateGuildAllowlist> {
  return raw.createGuildAllowlist(context, guildId, allowlistId, type);
}


export async function createGuildBlocklist(
  context: Command.Context,
  guildId: string,
  blocklistId: string,
  type: GuildBlocklistTypes,
): Promise<RestResponses.CreateGuildBlocklist> {
  return raw.createGuildBlocklist(context, guildId, blocklistId, type);
}


export async function createGuildDisabledCommand(
  context: Command.Context,
  guildId: string,
  command: string,
  disabledId: string,
  type: GuildDisableCommandsTypes,
): Promise<RestResponses.CreateGuildDisabledCommand> {
  return raw.createGuildDisabledCommand(context, guildId, command, disabledId, type);
}


export async function createGuildPrefix(
  context: Command.Context,
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


export async function createUserCommand(
  context: Command.Context,
  userId: string,
  command: string,
  options: RestOptions.CreateUserCommand,
) {
  return raw.createUserCommand(context, userId, command, options);
}


export async function deleteGuildAllowlist(
  context: Command.Context,
  guildId: string,
  allowlistId: string,
  type: GuildAllowlistTypes,
): Promise<RestResponses.DeleteGuildAllowlist> {
  return raw.deleteGuildAllowlist(context, guildId, allowlistId, type);
}


export async function deleteGuildBlocklist(
  context: Command.Context,
  guildId: string,
  blocklistId: string,
  type: GuildBlocklistTypes,
): Promise<RestResponses.DeleteGuildBlocklist> {
  return raw.deleteGuildBlocklist(context, guildId, blocklistId, type);
}


export async function deleteGuildDisabledCommand(
  context: Command.Context,
  guildId: string,
  command: string,
  disabledId: string,
  type: GuildDisableCommandsTypes,
): Promise<RestResponses.DeleteGuildDisabledCommand> {
  return raw.deleteGuildDisabledCommand(context, guildId, command, disabledId, type);
}


export async function deleteGuildPrefix(
  context: Command.Context,
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


export async function editGuildSettings(
  context: Command.Context,
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


export async function fetchGuildSettings(
  context: Command.Context,
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


export async function googleContentVisionOCR(
  context: Command.Context,
  options: RestOptions.GoogleContentVisionOCR,
) {
  return raw.googleContentVisionOCR(context, options);
}


export async function googleSearch(
  context: Command.Context,
  options: RestOptions.GoogleSearch,
) {
  return raw.googleSearch(context, options);
}


export async function googleSearchImages(
  context: Command.Context,
  options: RestOptions.GoogleSearchImages,
): Promise<RestResponses.GoogleSearchImages> {
  const data = await raw.googleSearchImages(context, options);
  const collection = [];
  for (let raw of data) {
    const result = new GoogleSearchImageResult(raw);
    collection.push(result);
  }
  return collection;
}


export async function googleTranslate(
  context: Command.Context,
  options: RestOptions.GoogleTranslate,
) {
  return raw.googleTranslate(context, options);
}


export async function imageJPEG(
  context: Command.Context,
  options: RestOptions.ImageJPEG,
) {
  return raw.imageJPEG(context, options);
}


export async function imageMagik(
  context: Command.Context,
  options: RestOptions.ImageMagik,
) {
  return raw.imageMagik(context, options);
}


export async function imageMagikGif(
  context: Command.Context,
  options: RestOptions.ImageMagikGif,
) {
  return raw.imageMagikGif(context, options);
}


export async function imageMirrorBottom(
  context: Command.Context,
  options: RestOptions.ImageMirrorBottom,
) {
  return raw.imageMirrorBottom(context, options);
}


export async function imageMirrorLeft(
  context: Command.Context,
  options: RestOptions.ImageMirrorLeft,
) {
  return raw.imageMirrorLeft(context, options);
}


export async function imageMirrorRight(
  context: Command.Context,
  options: RestOptions.ImageMirrorRight,
) {
  return raw.imageMirrorLeft(context, options);
}


export async function imageMirrorTop(
  context: Command.Context,
  options: RestOptions.ImageMirrorTop,
) {
  return raw.imageMirrorTop(context, options);
}


export async function imageResize(
  context: Command.Context,
  options: RestOptions.ImageResize,
) {
  return raw.imageResize(context, options);
}


export async function putGuildSettings(
  context: Command.Context,
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


export async function searchDuckDuckGo(
  context: Command.Context,
  options: RestOptions.SearchDuckDuckGo,
) {
  return raw.searchDuckDuckGo(context, options);
}


export async function searchDuckDuckGoImages(
  context: Command.Context,
  options: RestOptions.SearchDuckDuckGoImages,
) {
  return raw.searchDuckDuckGoImages(context, options);
}


export async function searchE621(
  context: Command.Context,
  options: RestOptions.SearchE621,
) {
  return raw.searchE621(context, options);
}


export async function searchE926(
  context: Command.Context,
  options: RestOptions.SearchE926,
) {
  return raw.searchE926(context, options);
}


export async function searchRule34(
  context: Command.Context,
  options: RestOptions.SearchRule34,
) {
  return raw.searchRule34(context, options);
}


export async function searchRule34Paheal(
  context: Command.Context,
  options: RestOptions.SearchRule34Paheal,
) {
  return raw.searchRule34Paheal(context, options);
}


export async function searchUrban(
  context: Command.Context,
  options: RestOptions.SearchUrban,
) {
  return raw.searchUrban(context, options);
}


export async function searchUrbanRandom(
  context: Command.Context,
  options: RestOptions.SearchUrbanRandom = {},
) {
  return raw.searchUrbanRandom(context, options);
}


export async function searchWolframAlpha(
  context: Command.Context,
  options: RestOptions.SearchWolframAlpha,
) {
  return raw.searchWolframAlpha(context, options);
}


export async function uploadCommands(
  context: Command.Context,
  options: RestOptions.UploadCommands,
) {
  return raw.uploadCommands(context, options);
}


export async function youtubeSearch(
  context: Command.Context,
  options: RestOptions.YoutubeSearch,
) {
  return raw.youtubeSearch(context, options);
}
