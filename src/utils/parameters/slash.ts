import { Interaction } from 'detritus-client';

import {
  GoogleLocales,
  GoogleLocalesText,
  ImageMemeFonts,
  ImageMemeFontsToText,
  MLDiffusionModels,
  UserFallbacksMediaImageTypes,
  UserUploadThresholdTypes,
} from '../../constants';
import { DefaultParameters } from '../../utils';


export const GOOGLE_LOCALES = [
  GoogleLocales.ENGLISH,
  GoogleLocales.ARABIC,
  GoogleLocales.CHINESE_SIMPLIFIED,
  GoogleLocales.CHINESE_TRADITIONAL,
  GoogleLocales.DUTCH,
  GoogleLocales.FINNISH,
  GoogleLocales.FRENCH,
  GoogleLocales.GERMAN,
  GoogleLocales.GREEK,
  GoogleLocales.HEBREW,
  GoogleLocales.INDONESIAN,
  GoogleLocales.ITALIAN,
  GoogleLocales.JAPANESE,
  GoogleLocales.KOREAN,
  GoogleLocales.MONGOLIAN,
  GoogleLocales.NORWEGIAN,
  GoogleLocales.POLISH,
  GoogleLocales.PUNJABI,
  GoogleLocales.PORTUGUESE_BRAZIL,
  GoogleLocales.PORTUGUESE_PORTUGAL,
  GoogleLocales.RUSSIAN,
  GoogleLocales.SPANISH,
  GoogleLocales.SWEDISH,
  GoogleLocales.TURKISH,
  GoogleLocales.VIETNAMESE,
].map((x) => ({name: GoogleLocalesText[x], value: x}));


export const IMAGE_MEME_FONTS = [
  ImageMemeFonts.ARIAL,
  ImageMemeFonts.FUTURA_CONDENSED_EXTRA_BOLD,
  ImageMemeFonts.IMPACT,
  ImageMemeFonts.MONTSERRAT_BOLD,
  ImageMemeFonts.MONTSERRAT_REGULAR,
  ImageMemeFonts.MONTSERRAT_SEMIBOLD,
  ImageMemeFonts.MPLUS_1C_BLACK,
  ImageMemeFonts.MPLUS_2P_BLACK,
  ImageMemeFonts.RUBIK_BLACK,
  ImageMemeFonts.TAHOMA_BOLD,
  ImageMemeFonts.TITILLIUMWEB_BLACK,
  ImageMemeFonts.TITILLIUMWEB_BOLD,
  ImageMemeFonts.TYPOLINE_DEMO,
].map((x) => ({name: ImageMemeFontsToText[x], value: x}));


export const USER_FALLBACKS_MEDIA_IMAGE_TYPES = [
  {name: 'Search Google Images', value: UserFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES},
  {name: 'Search Duck Duck Go Images', value: UserFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES},
  {name: 'Generate Image', value: UserFallbacksMediaImageTypes.IMAGINE},
];


export const USER_UPLOAD_THRESHOLD_TYPES = [
  {name: 'Exceeds Discord File Size Limits (Default)', value: UserUploadThresholdTypes.EXCEEDS_DISCORD_LIMIT},
  {name: 'Always', value: UserUploadThresholdTypes.ALWAYS},
  {name: 'Never', value: UserUploadThresholdTypes.NEVER},
];


export function safe(value: boolean, context: Interaction.InteractionContext): Boolean {
  if (value) {
    return value;
  }

  const shouldBeSafe = DefaultParameters.safe(context);
  if (shouldBeSafe) {
    throw new Error('Channel doesn\'t support disabling NSFW filtering.');
  }
  return value;
}
