import { Interaction } from 'detritus-client';

import { GoogleLocales, GoogleLocalesText } from '../../constants';
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
