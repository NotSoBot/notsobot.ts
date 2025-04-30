import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.ai.model';

export interface CommandArgs {
  model?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.model) {
    if (oldSettings && oldSettings.ml_llm_model === args.model) {
      if (oldSettings.ml_llm_model) {
        text = `Your AI Model preference is already ${Markup.bold(oldSettings.ml_llm_model)}`;
      } else {
        text = 'You currently do not have an AI Model preference.';
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        mlLLMModel: args.model,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.ml_llm_model) {
        text = `Ok, set your AI Model preference to ${Markup.bold(settings.ml_llm_model)}`;
      } else {
        // this should never happen currently
        text = 'Ok, cleared out your AI Model preference.';
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.ml_llm_model) {
        text = `Your current AI Model preference is ${Markup.bold(oldSettings.ml_llm_model)}`;
      } else {
        text = 'You currently do not have an AI Model preference.';
      }
    } else {
      text = 'Error fetching your current AI Model preference.';
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
