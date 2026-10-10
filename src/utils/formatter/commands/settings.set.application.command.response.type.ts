import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { UserSettingsApplicationCommandResponseTypes } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.application.command.response.type';

export interface CommandArgs {
  type?: UserSettingsApplicationCommandResponseTypes,
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
      switch (settings.application_command_response_type) {
        case UserSettingsApplicationCommandResponseTypes.AUTOMATIC: {
          text = 'Your current setting will have Application Commands automatically choose if the response should be Ephemeral.';
        }; break;
        case UserSettingsApplicationCommandResponseTypes.EPHEMERAL: {
          text = 'Your current setting will have Application Commands respond Ephemerally.';
        }; break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {
      applicationCommandResponseType: args.type,
    });
    switch (settings.application_command_response_type) {
      case UserSettingsApplicationCommandResponseTypes.AUTOMATIC: {
        text = 'Ok, Application Commands will automatically choose if the response should be Ephemeral.';
      }; break;
      case UserSettingsApplicationCommandResponseTypes.EPHEMERAL: {
        text = 'Ok, Application Commands will always respond Ephemerally.';
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
