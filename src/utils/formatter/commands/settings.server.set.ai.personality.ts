import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import { getTranslator } from '../../i18n';

import { editGuildSettings } from '../../../api';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.server.set.ai.personality';

export interface CommandArgs {
  clear?: boolean,
  personality?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);

  let text: string;
  if (args.personality || args.clear) {
    if (args.clear || (args.personality && args.personality.toLowerCase() === 'clear')) {
      args.personality = null;
    }
    if (guildSettings && guildSettings.settings.mlLLMPersonality === args.personality) {
      if (guildSettings.settings.mlLLMPersonality) {
        text = translate('settings_server_set_ai_personality.this_server_s_ai_personality_is_already', {mlLLMPersonality: Markup.codeblock(guildSettings.settings.mlLLMPersonality)});
      } else {
        text = translate('settings_server_set_ai_personality.this_server_currently_does_not_have_an');
      }
    } else {
      // update it
      const { settings } = await editGuildSettings(context, context.guildId!, {
        mlLLMPersonality: args.personality,
      });

      if (settings.mlLLMPersonality) {
        text = translate('settings_server_set_ai_personality.ok_set_this_server_s_ai_personality', {mlLLMPersonality: Markup.codeblock(settings.mlLLMPersonality)});
      } else {
        text = translate('settings_server_set_ai_personality.ok_cleared_out_this_server_s_ai');
      }
    }
  } else {
    if (guildSettings) {
      if (guildSettings.settings.mlLLMPersonality) {
        text = translate('settings_server_set_ai_personality.this_server_s_current_ai_personality_is', {mlLLMPersonality: Markup.codeblock(guildSettings.settings.mlLLMPersonality)});
      } else {
        text = translate('settings_server_set_ai_personality.this_server_currently_does_not_have_an');
      }
    } else {
      text = translate('settings_server_set_ai_personality.error_fetching_this_server_s_current_ai');
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
