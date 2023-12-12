import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { editUser } from '../../../api';
import { UserUploadThresholdTypes } from '../../../constants';
import UserStore from '../../../stores/users';
import { editOrReply } from '../..';


export const COMMAND_ID = 'settings.set.file.upload.threshold';

export interface CommandArgs {
  threshold?: UserUploadThresholdTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let text: string = 'Unknown Error, Sorry';
  if (args.threshold === undefined) {
    const user = (await UserStore.getOrFetch(context, context.userId))!;
    switch (user.file.uploadThreshold) {
      case UserUploadThresholdTypes.ALWAYS: {
        text = 'Your current setting will always upload files to our servers';
      }; break;
      case UserUploadThresholdTypes.EXCEEDS_DISCORD_LIMIT: {
        text = 'Your current setting will only upload files if they exceed Discord\'s File Size Limit';
      }; break;
      case UserUploadThresholdTypes.NEVER: {
        text = 'Your current setting will never upload files to our servers';
      }; break;
    }
  } else {
    const user = await editUser(context, context.userId, {
      uploadThreshold: args.threshold,
    });
    switch (user.file.uploadThreshold) {
      case UserUploadThresholdTypes.ALWAYS: {
        text = 'Ok, will always upload files to our servers';
      }; break;
      case UserUploadThresholdTypes.EXCEEDS_DISCORD_LIMIT: {
        text = 'Ok, will only upload files if they exceed Discord\'s File Size Limit';
      }; break;
      case UserUploadThresholdTypes.NEVER: {
        text = 'Ok, will never upload files to our servers';
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
