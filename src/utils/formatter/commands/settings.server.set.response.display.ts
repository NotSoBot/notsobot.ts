import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import GuildSettingsStore from '../../../stores/guildsettings';

import { editGuildSettings } from '../../../api';
import { GuildSettingsResponseDisplayTypes } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.server.set.response.display';

export interface CommandArgs {
  type?: GuildSettingsResponseDisplayTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let text: string = 'Unknown Error, Sorry';
  if (args.type === undefined) {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (guildSettings) {
      switch (guildSettings.settings.responseDisplay) {
        case GuildSettingsResponseDisplayTypes.DEFAULT: {
          text = 'This server\'s current setting will display responses with our latest format';
        }; break;
        case GuildSettingsResponseDisplayTypes.NO_EMBED: {
          text = 'This server\'s current setting will display responses without using embeds';
        }; break;
        case GuildSettingsResponseDisplayTypes.LEGACY: {
          text = 'This server\'s current setting will display responses in our legacy format using embeds';
        }; break;
      }
    } else {
      text = 'Error fetching this server\'s current response display setting.';
    }
  } else {
    const { settings } = await editGuildSettings(context, context.guildId!, {
      responseDisplay: args.type,
    });
    switch (settings.responseDisplay) {
      case GuildSettingsResponseDisplayTypes.DEFAULT: {
        text = 'Ok, will display this server\'s responses with our latest format';
      }; break;
      case GuildSettingsResponseDisplayTypes.NO_EMBED: {
        text = 'Ok, will display this server\'s responses without using embeds (logs will still use embeds)';
      }; break;
      case GuildSettingsResponseDisplayTypes.LEGACY: {
        text = 'Ok, will display this server\'s responses in our legacy format using embeds';
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
