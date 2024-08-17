import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { GoogleLocales } from '../../../constants';
import { editOrReply, languageCodeToText } from '../../../utils';


export const COMMAND_ID = 'settings.set.locale';

export interface CommandArgs {
  locale?: GoogleLocales | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.locale) {
    if (oldSettings && oldSettings.locale === args.locale) {
      if (oldSettings.locale) {
        const languageText = languageCodeToText(oldSettings.locale);
        text = `Your locale is already ${Markup.bold(languageText)}`;
      } else {
        text = 'You currently do not have a locale preference.';
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        locale: args.locale,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.locale) {
        const languageText = languageCodeToText(settings.locale);
        text = `Ok, set your locale preference to ${Markup.bold(languageText)}`;
      } else {
        // this should never happen currently
        text = 'Ok, cleared out your locale preference';
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.locale) {
        const languageText = languageCodeToText(oldSettings.locale);
        text = `Your current locale is ${Markup.bold(languageText)}`;
      } else {
        text = 'You currently do not have a locale preference.';
      }
    } else {
      text = 'Error fetching your current locale.';
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
