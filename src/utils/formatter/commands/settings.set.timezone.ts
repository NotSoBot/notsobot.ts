import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { editOrReply, timezoneCodeToText } from '../../../utils';


export const COMMAND_ID = 'settings.set.timezone';

export interface CommandArgs {
  timezone?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.timezone) {
    if (oldSettings && oldSettings.timezone === args.timezone) {
      if (oldSettings.timezone) {
        const languageText = timezoneCodeToText(oldSettings.timezone);
        text = `Your timezone is already ${Markup.bold(languageText)}`;
      } else {
        text = 'You currently do not have a timezone preference.';
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        timezone: args.timezone,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.timezone) {
        const languageText = timezoneCodeToText(settings.timezone);
        text = `Ok, set your timezone preference to ${Markup.bold(languageText)}`;
      } else {
        // this should never happen currently
        text = 'Ok, cleared out your default timezone preference';
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.timezone) {
        const languageText = timezoneCodeToText(oldSettings.timezone);
        text = `Your current timezone is ${Markup.bold(languageText)}`;
      } else {
        text = 'You currently do not have a timezone preference.';
      }
    } else {
      text = 'Error fetching your current timezone.';
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
