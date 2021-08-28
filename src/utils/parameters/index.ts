import { Command, Interaction } from 'detritus-client';

import { GoogleLocaleFromDiscord, GoogleLocales, GoogleLocalesText } from '../../constants';
import { DefaultParameters } from '../../utils';


import * as ContextMenu from './context-menu';
import * as Prefixed from './prefixed';
import * as Slash from './slash';

export { ContextMenu, Prefixed, Slash };

export * from './prefixed';



export async function locale(value: string, context: Command.Context | Interaction.InteractionContext): Promise<GoogleLocales> {
  if (!value) {
    return await DefaultParameters.locale(context);
  }

  value = value.toLowerCase().replace(/ /g, '_');
  for (let key in GoogleLocales) {
    const locale = (GoogleLocales as any)[key];
    if (locale.toLowerCase() === value) {
      return locale;
    }
  }

  for (let key in GoogleLocales) {
    const name = key.toLowerCase();
    if (name.includes(value)) {
      return (GoogleLocales as any)[key];
    }
  }

  for (let key in GoogleLocalesText) {
    const name = (GoogleLocalesText as any)[key].toLowerCase();
    if (name.includes(value)) {
      return key as GoogleLocales;
    }
  }

  const locales = Object.values(GoogleLocalesText).map((locale) => {
    if (locale.includes(',')) {
      return `(\`${locale}\`)`;
    }
    return `\`${locale}\``;
  });
  throw new Error(`Must be one of ${locales.join(', ')}`);
}
