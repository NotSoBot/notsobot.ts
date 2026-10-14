import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editTag } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { GuildFeatures, UserFlags } from '../../../constants';
import GuildMetadataStore from '../../../stores/guildmetadata';
import GuildSettingsStore from '../../../stores/guildsettings';
import TagCustomCommandsStore from '../../../stores/tagcustomcommands';
import UserStore from '../../../stores/users';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'tag.commandify.enable';

export interface CommandArgsBefore {
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  tag: RestResponsesRaw.Tag,
}

/**
 * Returns the reason the user cannot add custom commands here, or null if they can.
 */
export async function getCannotAddReason(
  context: Command.Context | Interaction.InteractionContext,
): Promise<null | string> {
  if (context.user.isClientOwner) {
    return null;
  }

  if (context.inDm) {
    const user = await UserStore.getOrFetch(context, context.userId);
    if (!user || (!user.premiumType && !user.hasFlag(UserFlags.OWNER))) {
      return 'You must have NotSoPremium to have custom commands!';
    }
  } else if (context.guildId) {
    const guildId = context.guildId!;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings && settings.features.has(GuildFeatures.FREE_CUSTOM_COMMANDS)) {
      return null;
    }

    // don't skip the owner check when the guild isn't cached, fetch it instead (and fail closed if we can't)
    let ownerId: null | string = null;
    if (context.guild) {
      ownerId = context.guild.ownerId;
    } else {
      const metadata = GuildMetadataStore.get(guildId);
      if (metadata && metadata.guild) {
        ownerId = metadata.guild.ownerId;
      } else {
        try {
          const guild = await context.rest.fetchGuild(guildId);
          ownerId = guild.ownerId;
        } catch(error) {
          ownerId = null;
        }
      }
    }

    // get owner
    const owner = (ownerId) ? await UserStore.getOrFetch(context, ownerId) : null;
    if (!owner || (!owner.premiumType && !owner.hasFlag(UserFlags.OWNER))) {
      return 'The server owner must have NotSoPremium to have custom commands here!';
    }
  }

  return null;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const tag = await editTag(context, args.tag.id, {isCommand: true});

  const payloadId = context.guildId || context.userId;
  TagCustomCommandsStore.insertSingle(payloadId, tag);

  return displayReply(context, {description: translate('tag_commands_add.successfully_made_a_custom_command', {name: Markup.codestring(tag.name)})});
}
