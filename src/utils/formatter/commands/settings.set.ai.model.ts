import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.ai.model';

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
    if (oldSettings && oldSettings.ml_llm_model === args.model) {
      if (oldSettings.ml_llm_model) {
        text = translate('settings_set_ai_model.your_ai_model_preference_is_already', {ml_llm_model: Markup.bold(oldSettings.ml_llm_model)});
      } else {
        text = translate('settings_set_ai_model.you_currently_do_not_have_an_ai');
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        mlLLMModel: args.model,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.ml_llm_model) {
        text = translate('settings_set_ai_model.ok_set_your_ai_model_preference_to', {ml_llm_model: Markup.bold(settings.ml_llm_model)});
      } else {
        text = translate('settings_set_ai_model.ok_cleared_out_your_ai_model_preference');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.ml_llm_model) {
        text = translate('settings_set_ai_model.your_current_ai_model_preference_is', {ml_llm_model: Markup.bold(oldSettings.ml_llm_model)});
      } else {
        text = translate('settings_set_ai_model.you_currently_do_not_have_an_ai');
      }
    } else {
      text = translate('settings_set_ai_model.error_fetching_your_current_ai_model_preference');
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
