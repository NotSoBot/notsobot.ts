import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.units';

export interface CommandArgs {
  clear?: boolean,
  units?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.units || args.clear) {
    if (args.clear) {
      args.units = null;
    }
    if (oldSettings && oldSettings.units === args.units) {
      if (oldSettings.units) {
        text = `Your Measurement Units preference is already ${Markup.bold(oldSettings.units)}`;
      } else {
        text = 'You currently do not have a Measurement Units preference.';
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        units: args.units,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.units) {
        text = `Ok, set your Measurement Units preference to ${Markup.bold(settings.units)}`;
      } else {
        // this should never happen currently
        text = 'Ok, cleared out your Measurement Units preference.';
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.units) {
        text = `Your current Measurement Units preference is ${Markup.bold(oldSettings.units)}`;
      } else {
        text = 'You currently do not have a Measurement Units preference.';
      }
    } else {
      text = 'Error fetching your current Measurement Units preference.';
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
