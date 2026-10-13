import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.units';

export interface CommandArgs {
  clear?: boolean,
  units?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.units || args.clear) {
    if (args.clear) {
      args.units = null;
    }
    if (oldSettings && oldSettings.units === args.units) {
      if (oldSettings.units) {
        text = translate('settings_set_units.your_measurement_units_preference_is_already', {units: Markup.bold(oldSettings.units)});
      } else {
        text = translate('settings_set_units.you_currently_do_not_have_a_measurement');
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        units: args.units,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.units) {
        text = translate('settings_set_units.ok_set_your_measurement_units_preference_to', {units: Markup.bold(settings.units)});
      } else {
        // this should never happen currently
        text = translate('settings_set_units.ok_cleared_out_your_measurement_units_preference');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.units) {
        text = translate('settings_set_units.your_current_measurement_units_preference_is', {units: Markup.bold(oldSettings.units)});
      } else {
        text = translate('settings_set_units.you_currently_do_not_have_a_measurement');
      }
    } else {
      text = translate('settings_set_units.error_fetching_your_current_measurement_units_preference');
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
