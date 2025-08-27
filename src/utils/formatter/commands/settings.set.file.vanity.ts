import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.file.vanity';

export interface CommandArgs {
  clear?: boolean,
  vanity?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.vanity || args.clear) {
    if (args.clear) {
      args.vanity = null;
    }
    if (oldSettings && oldSettings.file_upload_vanity === args.vanity) {
      if (oldSettings.file_upload_vanity) {
        text = `Your file upload vanity is already ${Markup.bold(oldSettings.file_upload_vanity)}`;
      } else {
        text = 'You currently do not have a file upload vanity set.';
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        vanity: args.vanity,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.file_upload_vanity) {
        text = `Ok, set your file upload vanity to ${Markup.bold(settings.file_upload_vanity)}`;
      } else {
        text = 'Ok, cleared out your file upload vanity.';
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.file_upload_vanity) {
        text = `Your current file upload vanity is ${Markup.bold(oldSettings.file_upload_vanity)}`;
      } else {
        text = 'You currently do not have a file upload vanity set.';
      }
    } else {
      text = 'Error fetching your current file upload vanity.';
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
