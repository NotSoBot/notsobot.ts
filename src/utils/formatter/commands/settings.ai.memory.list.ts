import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { fetchUserLLMMemories } from '../../../api';
import { EmbedColors, StatusEmojis } from '../../../constants';
import { DisplayPayload, displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.ai.memory.list';

// same as the api's `MAX_LLM_MEMORY_AMOUNT`
export const MAX_MEMORIES = 20;

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);

  const [ response, settings ] = await Promise.all([
    fetchUserLLMMemories(context, context.userId),
    UserSettingsStore.getOrFetch(context, context.userId),
  ]);

  const description: Array<string> = [];
  if (settings && settings.ml_llm_memory_disabled) {
    description.push(`${StatusEmojis.WARNING} ${translate('settings_ai_memory.memory_is_off')}`, '');
  }
  if (response.memories.length) {
    // the numbers are what NotSoAI and `forget` use, the same ones the api counts by
    for (let memory of response.memories) {
      const line = `${Markup.bold(String(memory.position))}: ${Markup.codestring(memory.content)}`;
      description.push((memory.guild_id) ? `${line} ${translate('settings_ai_memory.this_server_only')}` : line);
    }
  } else {
    description.push(translate('settings_ai_memory.nothing_yet'));
  }

  const payload: DisplayPayload = {
    color: EmbedColors.DEFAULT,
    description: description.join('\n'),
    ephemeral: true,
    footer: translate('settings_ai_memory.footer', {
      count: response.count.toLocaleString(language),
      max: MAX_MEMORIES.toLocaleString(language),
    }),
    title: translate('settings_ai_memory.title'),
  };
  return displayReply(context, payload);
}
