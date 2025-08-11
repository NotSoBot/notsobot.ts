import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';

import { editGuildSettings } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.server.set.ai.personality';

export interface CommandArgs {
  personality?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);

  let text: string;
  if (args.personality) {
    if (args.personality.toLowerCase() === 'clear') {
      args.personality = null;
    }
    if (guildSettings && guildSettings.settings.mlLLMPersonality === args.personality) {
      if (guildSettings.settings.mlLLMPersonality) {
        text = `This server\'s AI Personality is already ${Markup.codeblock(guildSettings.settings.mlLLMPersonality)}`;
      } else {
        text = 'This server currently does not have an AI Personality set.';
      }
    } else {
      // update it
      const { settings } = await editGuildSettings(context, context.guildId!, {
        mlLLMPersonality: args.personality,
      });

      if (settings.mlLLMPersonality) {
        text = `Ok, set this server\'s AI Personality to ${Markup.codeblock(settings.mlLLMPersonality)}`;
      } else {
        // this should never happen currently
        text = 'Ok, cleared out this server\'s AI Personality.';
      }
    }
  } else {
    if (guildSettings) {
      if (guildSettings.settings.mlLLMPersonality) {
        text = `This server\'s current AI Personality is ${Markup.codeblock(guildSettings.settings.mlLLMPersonality)}`;
      } else {
        text = 'This server currently does not have an AI Personality set.';
      }
    } else {
      text = 'Error fetching this server\'s current AI Personality.';
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
