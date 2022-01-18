import { Command, Interaction } from 'detritus-client';

import {
  GoogleLocaleFromDiscord,
  GoogleLocales,
} from '../../constants';


export function serverLocale(context: Command.Context | Interaction.InteractionContext): GoogleLocales {
  if (context.guild) {
    const value = context.guild.preferredLocale;
    if (value in GoogleLocaleFromDiscord) {
      return (GoogleLocaleFromDiscord as any)[value];
    }
    return value as unknown as GoogleLocales;
  }
  return GoogleLocales.ENGLISH;
}
