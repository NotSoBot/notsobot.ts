import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.ml.imagine.model';

export interface CommandArgs {
  clear?: boolean,
  model?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.model || args.clear) {
    if (args.clear) {
      args.model = null;
    }
    if (oldSettings && oldSettings.ml_diffusion_model === args.model) {
      if (oldSettings.ml_diffusion_model) {
        text = translate('settings_set_ml_imagine_model.your_ml_diffusion_model_preference_is_already', {ml_diffusion_model: Markup.bold(oldSettings.ml_diffusion_model)});
      } else {
        text = translate('settings_set_ml_imagine_model.you_currently_do_not_have_a_ml');
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        mlDiffusionModel: args.model,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.ml_diffusion_model) {
        text = translate('settings_set_ml_imagine_model.ok_set_your_ml_diffusion_model_preference', {ml_diffusion_model: Markup.bold(settings.ml_diffusion_model)});
      } else {
        text = translate('settings_set_ml_imagine_model.ok_cleared_out_your_ml_diffusion_model');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.ml_diffusion_model) {
        text = translate('settings_set_ml_imagine_model.your_current_ml_diffusion_model_preference_is', {ml_diffusion_model: Markup.bold(oldSettings.ml_diffusion_model)});
      } else {
        text = translate('settings_set_ml_imagine_model.you_currently_do_not_have_a_ml');
      }
    } else {
      text = translate('settings_set_ml_imagine_model.error_fetching_your_current_ml_diffusion_model');
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
