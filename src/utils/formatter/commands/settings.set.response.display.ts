import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { UserSettingsResponseDisplayTypes } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.response.display';

export interface CommandArgs {
  type?: UserSettingsResponseDisplayTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let text: string = 'Unknown Error, Sorry';
  if (args.type === undefined) {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (settings) {
      switch (settings.response_display) {
        case UserSettingsResponseDisplayTypes.DEFAULT: {
          text = 'Your current setting will display responses with our latest format';
        }; break;
        case UserSettingsResponseDisplayTypes.NO_EMBED: {
          text = 'Your current setting will display responses without using embeds';
        }; break;
        case UserSettingsResponseDisplayTypes.LEGACY: {
          text = 'Your current setting will display responses in our legacy format using embeds';
        }; break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {
      responseDisplay: args.type,
    });
    switch (settings.response_display) {
      case UserSettingsResponseDisplayTypes.DEFAULT: {
        text = 'Ok, will display responses with our latest format';
      }; break;
      case UserSettingsResponseDisplayTypes.NO_EMBED: {
        text = 'Ok, will display responses without using embeds';
      }; break;
      case UserSettingsResponseDisplayTypes.LEGACY: {
        text = 'Ok, will display responses in our legacy format using embeds';
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
