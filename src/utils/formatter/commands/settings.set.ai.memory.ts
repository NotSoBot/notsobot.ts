import { Command, Interaction } from 'detritus-client';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.ai.memory';

export interface CommandArgs {
  // left out shows the current setting
  enabled?: boolean | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  let text: string;
  if (typeof(args.enabled) === 'boolean') {
    const settings = await editUserSettings(context, context.userId, {mlLLMMemoryDisabled: !args.enabled});
    UserSettingsStore.insert(context.userId, settings);
    text = (settings.ml_llm_memory_disabled) ? translate('settings_set_ai_memory.turned_off') : translate('settings_set_ai_memory.turned_on');
  } else {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    text = (settings && settings.ml_llm_memory_disabled) ? translate('settings_set_ai_memory.memory_is_off') : translate('settings_set_ai_memory.memory_is_on');
  }

  return displayReply(context, {description: text, ephemeral: true});
}
