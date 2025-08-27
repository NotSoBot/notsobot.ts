import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.personality || args.clear) {
    if (args.clear || (args.personality && args.personality.toLowerCase() === 'clear')) {
      args.personality = null;
    }
    if (oldSettings && oldSettings.ml_llm_personality === args.personality) {
      if (oldSettings.ml_llm_personality) {
        text = `Your AI Personality is already ${Markup.codeblock(oldSettings.ml_llm_personality)}`;
      } else {
        text = 'You currently do not have an AI Personality set.';
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        mlLLMPersonality: args.personality,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.ml_llm_personality) {
        text = `Ok, set your AI Personality to ${Markup.codeblock(settings.ml_llm_personality)}`;
      } else {
        text = 'Ok, cleared out your AI Personality.';
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.ml_llm_personality) {
        text = `Your current AI Personality is ${Markup.codeblock(oldSettings.ml_llm_personality)}`;
      } else {
        text = 'You currently do not have an AI Personality set.';
      }
    } else {
      text = 'Error fetching your current AI Personality.';
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
