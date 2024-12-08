import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.download.quality';

export interface CommandArgs {
  quality?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.quality) {
    if (oldSettings && oldSettings.download_quality === args.quality) {
      if (oldSettings.download_quality) {
        text = `Your Download Quality preference is already ${Markup.bold(oldSettings.download_quality)}`;
      } else {
        text = 'You currently do not have a Download Quality preference.';
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        downloadQuality: args.quality,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.download_quality) {
        text = `Ok, set your Download Quality preference to ${Markup.bold(settings.download_quality)}`;
      } else {
        // this should never happen currently
        text = 'Ok, cleared out your Download Quality preference.';
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.download_quality) {
        text = `Your current Download Quality preference is ${Markup.bold(oldSettings.download_quality)}`;
      } else {
        text = 'You currently do not have a Download Quality preference.';
      }
    } else {
      text = 'Error fetching your current Download Quality preference.';
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
