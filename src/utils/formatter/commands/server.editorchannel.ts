import { Interaction, Structures } from 'detritus-client';
import { AppChannelUnsupportedReasons, ChannelTypes, DiscordAbortCodes } from 'detritus-client/lib/constants';
import { DiscordHTTPError } from 'detritus-client-rest/lib/errors';

import { StatusEmojis } from '../../../constants';
import { getGuildTranslator, getTranslator } from '../../i18n';
import { displayReply, formatUserTag } from '../../../utils';


// `/server editor-channel`: an App Channel (Discord's preview, type 21) bound to NotSoBot, so the media editor and the
// games stay open inline in it with the channel's chat beside them. Servers have to be in Discord's preview first


export const COMMAND_ID = 'server.editor.channel';

export const DEFAULT_CHANNEL_NAME = 'notsobot';

export interface CommandArgs {
  name?: string,
}


function warn(context: Interaction.InteractionContext, text: string) {
  return displayReply(context, {description: `${StatusEmojis.WARNING} ${text}`, ephemeral: true});
}


// discord's word on whether NotSoBot can be bound to an App Channel here. null when the server isn't in the preview: the
// route refuses (403/404) or doesn't list NotSoBot at all
async function fetchOwnEmbeddedApplication(context: Interaction.InteractionContext, guildId: string) {
  let items: Awaited<ReturnType<typeof context.rest.fetchGuildEmbeddedApplications>>['items'];
  try {
    ({ items } = await context.rest.fetchGuildEmbeddedApplications(guildId));
  } catch(error) {
    if (error instanceof DiscordHTTPError && (error.response.statusCode === 403 || error.response.statusCode === 404)) {
      return null;
    }
    throw error;
  }
  return (items || []).find((item) => item.application && item.application.id === context.applicationId) || null;
}


export async function createMessage(
  context: Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  // installed with only its commands (no bot), the channel would be bound to an app that can't post in it
  const guild = context.guild;
  if (!guild) {
    return warn(context, translate('server_editor_channel.requires_bot'));
  }

  const embedded = await fetchOwnEmbeddedApplication(context, guild.id);
  if (!embedded) {
    return warn(context, translate('server_editor_channel.not_in_preview'));
  }
  if (!embedded.status.supported) {
    if (embedded.status.reason === AppChannelUnsupportedReasons.REQUIRES_BOT) {
      return warn(context, translate('server_editor_channel.requires_bot'));
    }
    return warn(context, translate('server_editor_channel.not_in_preview'));
  }

  const audit = await getGuildTranslator(context);
  const name = (args.name && args.name.trim()) ? args.name.trim().slice(0, 100) : DEFAULT_CHANNEL_NAME;
  let channel: Structures.Channel;
  try {
    // discord gives NotSoBot its own overwrite in the channel (PERMISSIONS_APP_CHANNEL_BOT), none are passed here so
    // nothing can deny it one (50299)
    channel = await guild.createChannel({
      applicationId: context.applicationId,
      name,
      reason: audit.translate('server_editor_channel.audit_create', {user: formatUserTag(context.user)}),
      type: ChannelTypes.GUILD_APP,
    });
  } catch(error) {
    if (error instanceof DiscordHTTPError) {
      switch (error.code) {
        case DiscordAbortCodes.INVALID_PERMISSIONS:
        case DiscordAbortCodes.INVALID_ACCESS:
        case DiscordAbortCodes.APP_CHANNEL_BOT_MINIMUM_PERMISSIONS: {
          return warn(context, translate('server_editor_channel.bot_missing_permissions'));
        }
        case DiscordAbortCodes.TOO_MANY_GUILD_CHANNELS: {
          return warn(context, translate('server_editor_channel.too_many_channels'));
        }
        // discord not taking type 21 here (the preview was turned off since the check above)
        case DiscordAbortCodes.INVALID_CHANNEL_TYPE:
        case DiscordAbortCodes.INVALID_FORM_BODY: {
          return warn(context, translate('server_editor_channel.not_in_preview'));
        }
      }
    }
    throw error;
  }

  return displayReply(context, {
    description: translate('server_editor_channel.created', {channel: channel.mention}),
  });
}
