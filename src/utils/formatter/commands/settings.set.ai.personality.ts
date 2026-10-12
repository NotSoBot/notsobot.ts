import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.ai.personality';

export interface CommandArgs {
  clear?: boolean,
  personality?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.personality || args.clear) {
    if (args.clear || (args.personality && args.personality.toLowerCase() === 'clear')) {
      args.personality = null;
    }
    if (oldSettings && oldSettings.ml_llm_personality === args.personality) {
      if (oldSettings.ml_llm_personality) {
        text = translate('settings_set_ai_personality.your_ai_personality_is_already', {ml_llm_personality: Markup.codeblock(oldSettings.ml_llm_personality)});
      } else {
        text = translate('settings_set_ai_personality.you_currently_do_not_have_an_ai');
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        mlLLMPersonality: args.personality,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.ml_llm_personality) {
        text = translate('settings_set_ai_personality.ok_set_your_ai_personality_to', {ml_llm_personality: Markup.codeblock(settings.ml_llm_personality)});
      } else {
        text = translate('settings_set_ai_personality.ok_cleared_out_your_ai_personality');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.ml_llm_personality) {
        text = translate('settings_set_ai_personality.your_current_ai_personality_is', {ml_llm_personality: Markup.codeblock(oldSettings.ml_llm_personality)});
      } else {
        text = translate('settings_set_ai_personality.you_currently_do_not_have_an_ai');
      }
    } else {
      text = translate('settings_set_ai_personality.error_fetching_your_current_ai_personality');
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
