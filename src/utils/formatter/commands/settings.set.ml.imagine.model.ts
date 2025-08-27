import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.model || args.clear) {
    if (args.clear) {
      args.model = null;
    }
    if (oldSettings && oldSettings.ml_diffusion_model === args.model) {
      if (oldSettings.ml_diffusion_model) {
        text = `Your ML Diffusion Model preference is already ${Markup.bold(oldSettings.ml_diffusion_model)}`;
      } else {
        text = 'You currently do not have a ML Diffusion Model preference.';
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        mlDiffusionModel: args.model,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.ml_diffusion_model) {
        text = `Ok, set your ML Diffusion Model preference to ${Markup.bold(settings.ml_diffusion_model)}`;
      } else {
        text = 'Ok, cleared out your ML Diffusion Model preference.';
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.ml_diffusion_model) {
        text = `Your current ML Diffusion Model preference is ${Markup.bold(oldSettings.ml_diffusion_model)}`;
      } else {
        text = 'You currently do not have a ML Diffusion Model preference.';
      }
    } else {
      text = 'Error fetching your current ML Diffusion Model preference.';
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
