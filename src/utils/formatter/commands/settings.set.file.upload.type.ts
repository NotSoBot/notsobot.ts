import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { UserSettingsUploadTypes } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.file.upload.type';

export interface CommandArgs {
  type?: UserSettingsUploadTypes,
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
      switch (settings.file_upload_type) {
        case UserSettingsUploadTypes.AUTOMATIC: {
          text = 'Your current setting will have files uploaded to our servers permanently if you are premium depending on your upload threshold settings.';
        }; break;
        case UserSettingsUploadTypes.TEMPORARY: {
          text = 'Your current setting will have files uploaded to our servers temporarily depending on your upload threshold settings.';
        }; break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {
      fileUploadType: args.type,
    });
    switch (settings.file_upload_type) {
      case UserSettingsUploadTypes.AUTOMATIC: {
        text = 'Ok, files will be uploaded to our servers permanently if you are premium depending on your upload threshold settings.';
      }; break;
      case UserSettingsUploadTypes.TEMPORARY: {
        text = 'Ok, files will be uploaded to our servers temporarily depending on your upload threshold settings.';
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
